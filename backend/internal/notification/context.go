package notification

import (
	"context"
	"time"

	"github.com/gin-gonic/gin"
	"inkblog-backend/pkg/utils"
)

const queuedToastsContextKey = "queued_notification_toasts"

type QueueOption func(*QueueItem)

func WithTitle(title string) QueueOption {
	return func(item *QueueItem) {
		item.Title = title
	}
}

func WithPayload(payload map[string]interface{}) QueueOption {
	return func(item *QueueItem) {
		item.Payload = payload
	}
}

func WithTTL(ttlSeconds int) QueueOption {
	return func(item *QueueItem) {
		item.TTLSeconds = ttlSeconds
	}
}

func WithDedupeKey(dedupeKey string) QueueOption {
	return func(item *QueueItem) {
		item.DedupeKey = dedupeKey
	}
}

func WithSessionTarget(sessionID string) QueueOption {
	return func(item *QueueItem) {
		item.Target = &Target{
			Type:      TargetTypeSession,
			SessionID: normalizeSessionID(sessionID),
		}
	}
}

func WithUserTarget(userID uint) QueueOption {
	return func(item *QueueItem) {
		item.Target = &Target{
			Type:   TargetTypeUser,
			UserID: userID,
		}
	}
}

func WithBroadcastTarget() QueueOption {
	return func(item *QueueItem) {
		item.Target = &Target{
			Type: TargetTypeBroadcast,
		}
	}
}

func QueueSuccess(c *gin.Context, message string, options ...QueueOption) {
	queueToast(c, LevelSuccess, message, options...)
}

func QueueWarning(c *gin.Context, message string, options ...QueueOption) {
	queueToast(c, LevelWarning, message, options...)
}

func QueueError(c *gin.Context, message string, options ...QueueOption) {
	queueToast(c, LevelError, message, options...)
}

func QueueInfo(c *gin.Context, message string, options ...QueueOption) {
	queueToast(c, LevelInfo, message, options...)
}

func DispatchQueuedToasts(c *gin.Context) {
	queuedAny, exists := c.Get(queuedToastsContextKey)
	if !exists {
		return
	}

	queued, ok := queuedAny.([]QueueItem)
	if !ok || len(queued) == 0 {
		return
	}

	settings := LoadSettings()
	client := NewInternalClient(settings)
	requestID := c.GetString(RequestIDContextKey)

	for _, item := range queued {
		target := resolveTarget(c, item.Target)
		if target == nil || target.Type == "" {
			continue
		}

		ctx, cancel := context.WithTimeout(context.Background(), settings.RequestTimeout)
		err := client.Enqueue(ctx, EnqueueRequest{
			SourceService:   "inkblog-backend",
			SourceRequestID: requestID,
			Target:          *target,
			Toast: Toast{
				Level:      item.Level,
				Title:      item.Title,
				Message:    item.Message,
				Payload:    item.Payload,
				TTLSeconds: item.TTLSeconds,
				DedupeKey:  item.DedupeKey,
			},
		})
		cancel()

		if err != nil {
			utils.Warn("[Notification] enqueue failed: request_id=%s target=%s message=%s err=%v", requestID, target.Type, item.Message, err)
			continue
		}

		utils.Info("[Notification] enqueue success: request_id=%s target=%s message=%s", requestID, target.Type, item.Message)
	}

	c.Set(queuedToastsContextKey, nil)
}

func ToastDispatchMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Next()
		DispatchQueuedToasts(c)
	}
}

func queueToast(c *gin.Context, level, message string, options ...QueueOption) {
	if c == nil || message == "" {
		return
	}

	item := QueueItem{
		Level:      level,
		Message:    message,
		TTLSeconds: DefaultTTLSeconds,
	}
	for _, option := range options {
		option(&item)
	}

	queuedAny, _ := c.Get(queuedToastsContextKey)
	queued, _ := queuedAny.([]QueueItem)
	queued = append(queued, item)
	c.Set(queuedToastsContextKey, queued)
}

func resolveTarget(c *gin.Context, explicit *Target) *Target {
	if explicit != nil && explicit.Type != "" {
		return explicit
	}

	sessionID := normalizeSessionID(c.GetHeader(ClientSessionHeader))
	if sessionID != "" {
		return &Target{
			Type:      TargetTypeSession,
			SessionID: sessionID,
		}
	}

	userIDAny, exists := c.Get("user_id")
	if exists {
		if userID, ok := userIDAny.(uint); ok && userID > 0 {
			return &Target{
				Type:   TargetTypeUser,
				UserID: userID,
			}
		}
	}

	return nil
}

func Now() time.Time {
	return time.Now()
}
