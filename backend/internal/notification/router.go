package notification

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	apimiddleware "inkblog-backend/internal/api/middleware"
	"inkblog-backend/pkg/utils"
)

func SetupRouter(service *Service) *gin.Engine {
	settings := service.settings

	r := gin.New()
	r.Use(apimiddleware.RequestID())
	r.Use(apimiddleware.Logger())
	r.Use(gin.Recovery())
	r.Use(apimiddleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	internal := r.Group("/internal")
	internal.Use(serviceAuthMiddleware(settings))
	internal.POST("/notifications", func(c *gin.Context) {
		var req EnqueueRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request: " + err.Error()})
			return
		}

		count, err := service.Enqueue(req)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": err.Error()})
			return
		}

		utils.Info("[Notification] queued deliveries=%d target=%s source_service=%s request_id=%s", count, req.Target.Type, req.SourceService, req.SourceRequestID)

		c.JSON(http.StatusOK, gin.H{
			"message": "queued",
			"data": gin.H{
				"created": count,
			},
		})
	})

	r.GET("/events/notifications/stream", func(c *gin.Context) {
		identity, err := resolveStreamIdentity(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}

		flusher, ok := c.Writer.(http.Flusher)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "streaming not supported"})
			return
		}

		connection := &StreamConnection{
			SessionID: identity.SessionID,
			UserID:    identity.UserID,
			Events:    make(chan StreamEvent, 64),
			Replaced:  make(chan struct{}),
		}

		service.Registry().Register(connection)
		defer service.Registry().Unregister(identity.SessionID)

		if identity.UserID != nil {
			if err := service.ClaimUserPendingDeliveries(*identity.UserID, identity.SessionID); err != nil {
				utils.Warn("[Notification] claim pending deliveries failed: session=%s err=%v", identity.SessionID, err)
			}
		}

		headers := c.Writer.Header()
		headers.Set("Content-Type", "text/event-stream")
		headers.Set("Cache-Control", "no-cache")
		headers.Set("Connection", "keep-alive")
		headers.Set("X-Accel-Buffering", "no")

		if err := writeSSE(c.Writer, "connected", gin.H{
			"session_id": identity.SessionID,
			"user_id":    identity.UserID,
		}); err != nil {
			return
		}
		flusher.Flush()

		if err := service.ReplayPendingDeliveries(identity.SessionID); err != nil {
			utils.Warn("[Notification] replay pending failed: session=%s err=%v", identity.SessionID, err)
		}

		heartbeat := time.NewTicker(settings.HeartbeatInterval)
		defer heartbeat.Stop()

		utils.Info("[Notification] stream connected: session=%s user_id=%v", identity.SessionID, identity.UserID)

		for {
			select {
			case event := <-connection.Events:
				if err := writeSSE(c.Writer, event.Event, event.Data); err != nil {
					utils.Warn("[Notification] stream write failed: session=%s err=%v", identity.SessionID, err)
					return
				}
				flusher.Flush()
			case <-heartbeat.C:
				if err := writeSSE(c.Writer, "heartbeat", gin.H{"ts": time.Now().UTC()}); err != nil {
					return
				}
				flusher.Flush()
			case <-connection.Replaced:
				utils.Info("[Notification] stream replaced: session=%s", identity.SessionID)
				return
			case <-c.Request.Context().Done():
				utils.Info("[Notification] stream disconnected: session=%s", identity.SessionID)
				return
			}
		}
	})

	api := r.Group("/api/v1/notifications")
	api.POST("/:deliveryId/ack", func(c *gin.Context) {
		var req AckRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request: " + err.Error()})
			return
		}

		userID, err := resolveOptionalUserID(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}

		if err := service.Ack(c.Param("deliveryId"), normalizeSessionID(req.ClientSessionID), userID); err != nil {
			switch {
			case errors.Is(err, gorm.ErrRecordNotFound):
				c.JSON(http.StatusNotFound, gin.H{"message": "delivery not found"})
			default:
				c.JSON(http.StatusForbidden, gin.H{"message": err.Error()})
			}
			return
		}

		utils.Info("[Notification] acknowledged delivery_id=%s session=%s user_id=%v", c.Param("deliveryId"), normalizeSessionID(req.ClientSessionID), userID)

		c.JSON(http.StatusOK, gin.H{"message": "acknowledged"})
	})

	api.GET("/pending", func(c *gin.Context) {
		identity, err := resolveStreamIdentity(c)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
			return
		}

		if identity.UserID != nil {
			if err := service.ClaimUserPendingDeliveries(*identity.UserID, identity.SessionID); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				return
			}
		}

		pending, err := service.PendingDeliveries(identity)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "success",
			"data":    pending,
		})
	})

	return r
}

func serviceAuthMiddleware(settings Settings) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "missing authorization"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" || parts[1] != settings.ServiceToken {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "invalid authorization"})
			return
		}

		c.Next()
	}
}

func resolveStreamIdentity(c *gin.Context) (StreamIdentity, error) {
	sessionID := normalizeSessionID(c.GetHeader(ClientSessionHeader))
	if sessionID == "" {
		sessionID = normalizeSessionID(c.Query("client_session_id"))
	}
	if sessionID == "" {
		return StreamIdentity{}, fmt.Errorf("missing client session id")
	}

	userID, err := resolveOptionalUserID(c)
	if err != nil {
		return StreamIdentity{}, err
	}

	return StreamIdentity{
		SessionID: sessionID,
		UserID:    userID,
	}, nil
}

func resolveOptionalUserID(c *gin.Context) (*uint, error) {
	authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
	if authHeader == "" {
		return nil, nil
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, fmt.Errorf("invalid authorization header")
	}

	claims, err := utils.ParseToken(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid token")
	}

	userID := claims.UserID
	return &userID, nil
}

func writeSSE(writer http.ResponseWriter, event string, data interface{}) error {
	encoded, err := json.Marshal(data)
	if err != nil {
		return err
	}

	if _, err := fmt.Fprintf(writer, "event: %s\n", event); err != nil {
		return err
	}
	if _, err := fmt.Fprintf(writer, "data: %s\n\n", string(encoded)); err != nil {
		return err
	}

	return nil
}
