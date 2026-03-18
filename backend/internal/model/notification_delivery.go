package model

import "time"

type NotificationDelivery struct {
	ID              uint       `gorm:"primarykey" json:"id"`
	CreatedAt       time.Time  `gorm:"index:idx_notification_session_status_created,priority:3;index:idx_notification_user_status_created,priority:3" json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
	DeliveryID      string     `gorm:"uniqueIndex;not null;size:64" json:"delivery_id"`
	SourceService   string     `gorm:"not null;size:100" json:"source_service"`
	SourceRequestID string     `gorm:"index;size:100" json:"source_request_id"`
	TargetType      string     `gorm:"index;not null;size:20" json:"target_type"`
	TargetUserID    *uint      `gorm:"index:idx_notification_user_status_created,priority:1" json:"target_user_id,omitempty"`
	TargetSessionID string     `gorm:"index:idx_notification_session_status_created,priority:1;size:100" json:"target_session_id"`
	Level           string     `gorm:"not null;size:20" json:"level"`
	Title           string     `gorm:"size:255" json:"title"`
	Message         string     `gorm:"type:text;not null" json:"message"`
	PayloadJSON     string     `gorm:"type:text" json:"payload_json"`
	Status          string     `gorm:"index:idx_notification_session_status_created,priority:2;index:idx_notification_user_status_created,priority:2;not null;size:20" json:"status"`
	DedupeKey       string     `gorm:"size:255" json:"dedupe_key"`
	AttemptCount    int        `gorm:"not null;default:0" json:"attempt_count"`
	LastDeliveredAt *time.Time `json:"last_delivered_at,omitempty"`
	AcknowledgedAt  *time.Time `json:"acknowledged_at,omitempty"`
	ExpiresAt       time.Time  `gorm:"index;not null" json:"expires_at"`
}

func (NotificationDelivery) TableName() string {
	return "notification_deliveries"
}
