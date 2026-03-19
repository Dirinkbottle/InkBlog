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

type PanelSummary struct {
	OnlineSessions    int `json:"online_sessions"`
	PendingCount      int `json:"pending_count"`
	DeliveredCount    int `json:"delivered_count"`
	AcknowledgedCount int `json:"acknowledged_count"`
	ExpiredCount      int `json:"expired_count"`
}

type OnlineSession struct {
	SessionID   string     `json:"session_id"`
	UserID      *uint      `json:"user_id,omitempty"`
	ConnectedAt *time.Time `json:"connected_at,omitempty"`
}

type DeliveryFilter struct {
	Status     string
	TargetType string
	UserID     *uint
	SessionID  string
	Page       int
	PageSize   int
}

type DeliveryRecord struct {
	DeliveryID      string                 `json:"delivery_id"`
	SourceService   string                 `json:"source_service"`
	SourceRequestID string                 `json:"source_request_id"`
	TargetType      string                 `json:"target_type"`
	TargetUserID    *uint                  `json:"target_user_id,omitempty"`
	TargetSessionID string                 `json:"target_session_id"`
	Level           string                 `json:"level"`
	Title           string                 `json:"title"`
	Message         string                 `json:"message"`
	Payload         map[string]interface{} `json:"payload"`
	Status          string                 `json:"status"`
	DedupeKey       string                 `json:"dedupe_key"`
	AttemptCount    int                    `json:"attempt_count"`
	LastDeliveredAt *time.Time             `json:"last_delivered_at,omitempty"`
	AcknowledgedAt  *time.Time             `json:"acknowledged_at,omitempty"`
	CreatedAt       time.Time              `json:"created_at"`
	ExpiresAt       time.Time              `json:"expires_at"`
}

type DeliveryListResult struct {
	Items    []DeliveryRecord `json:"items"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"page_size"`
}

type PanelSendRequest struct {
	Target Target `json:"target" binding:"required"`
	Toast  Toast  `json:"toast" binding:"required"`
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
