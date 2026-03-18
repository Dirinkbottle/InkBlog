package notification

import "time"

const (
	TargetTypeSession   = "session"
	TargetTypeUser      = "user"
	TargetTypeBroadcast = "broadcast"

	StatusPending      = "pending"
	StatusDelivered    = "delivered"
	StatusAcknowledged = "acknowledged"
	StatusExpired      = "expired"

	LevelSuccess = "success"
	LevelError   = "error"
	LevelWarning = "warning"
	LevelInfo    = "info"
)

const (
	ClientSessionHeader = "X-Client-Session-Id"
	RequestIDContextKey = "request_id"
	DefaultTTLSeconds   = 600
)

type Target struct {
	Type      string `json:"type"`
	SessionID string `json:"session_id,omitempty"`
	UserID    uint   `json:"user_id,omitempty"`
}

type Toast struct {
	Level      string                 `json:"level"`
	Title      string                 `json:"title,omitempty"`
	Message    string                 `json:"message"`
	Payload    map[string]interface{} `json:"payload,omitempty"`
	TTLSeconds int                    `json:"ttl_seconds,omitempty"`
	DedupeKey  string                 `json:"dedupe_key,omitempty"`
}

type EnqueueRequest struct {
	SourceService   string `json:"source_service"`
	SourceRequestID string `json:"source_request_id"`
	Target          Target `json:"target"`
	Toast           Toast  `json:"toast"`
}

type AckRequest struct {
	ClientSessionID string `json:"client_session_id" binding:"required"`
}

type EventPayload struct {
	DeliveryID string                 `json:"delivery_id"`
	TargetType string                 `json:"target_type"`
	Level      string                 `json:"level"`
	Title      string                 `json:"title,omitempty"`
	Message    string                 `json:"message"`
	Payload    map[string]interface{} `json:"payload,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	ExpiresAt  time.Time              `json:"expires_at"`
}

type QueueItem struct {
	Target     *Target
	Level      string
	Title      string
	Message    string
	Payload    map[string]interface{}
	TTLSeconds int
	DedupeKey  string
}

type StreamIdentity struct {
	SessionID string
	UserID    *uint
}
