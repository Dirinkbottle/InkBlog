package corecontrol

import (
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	apimiddleware "inkblog-backend/internal/api/middleware"
	"inkblog-backend/pkg/utils"
)

func SetupRouter(service *Service) *gin.Engine {
	r := gin.New()
	r.Use(apimiddleware.RequestID())
	r.Use(apimiddleware.Logger())
	r.Use(gin.Recovery())
	r.Use(apimiddleware.CORS())

	registerDeployRoutes(r, service)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1/admin/services")
	api.Use(adminAuthMiddleware())
	{
		api.GET("", func(c *gin.Context) {
			response, err := service.ListSlots(c.Request.Context())
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "success",
				"data":    response,
			})
		})

		api.POST("/:serviceId/actions", func(c *gin.Context) {
			var req ServiceActionRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "invalid request: " + err.Error()})
				return
			}

			lock, err := service.RunAction(c.Request.Context(), c.Param("serviceId"), req.Action)
			if err != nil {
				status := http.StatusBadRequest
				if strings.Contains(err.Error(), "not found") {
					status = http.StatusNotFound
				}
				if errors.Is(err, errServiceActionInProgress) {
					status = http.StatusConflict
				}
				c.JSON(status, gin.H{"message": err.Error()})
				return
			}

			utils.Info("[CoreControl] action=%s service=%s", req.Action, c.Param("serviceId"))
			c.JSON(http.StatusAccepted, gin.H{
				"message": "accepted",
				"data": gin.H{
					"service_id":   c.Param("serviceId"),
					"action":       req.Action,
					"control_lock": lock,
				},
			})
		})

		panelHandler := func(c *gin.Context) {
			body, err := io.ReadAll(c.Request.Body)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "failed to read request body"})
				return
			}

			resp, err := service.ProxyPanel(
				c.Request.Context(),
				c.Param("serviceId"),
				c.Request.Method,
				c.Param("panelPath"),
				c.Request.URL.RawQuery,
				c.GetHeader("Content-Type"),
				body,
			)
			if err != nil {
				status := http.StatusBadRequest
				if strings.Contains(err.Error(), "not found") {
					status = http.StatusNotFound
				}
				if strings.Contains(err.Error(), "does not expose") {
					status = http.StatusNotFound
				}
				c.JSON(status, gin.H{"message": err.Error()})
				return
			}

			if resp.ContentType != "" {
				c.Header("Content-Type", resp.ContentType)
			}
			c.Status(resp.StatusCode)
			_, _ = c.Writer.Write(resp.Body)
		}

		api.GET("/:serviceId/panel/*panelPath", panelHandler)
		api.POST("/:serviceId/panel/*panelPath", panelHandler)
	}

	return r
}

func adminAuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "missing authorization"})
			c.Abort()
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid authorization header"})
			c.Abort()
			return
		}

		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid token"})
			c.Abort()
			return
		}

		if claims.Role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"message": "admin role required"})
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Next()
	}
}
