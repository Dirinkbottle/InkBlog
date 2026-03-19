package notification

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

type Service struct {
	db       *gorm.DB
	settings Settings
	registry *ConnectionRegistry
}

func NewService(db *gorm.DB, settings Settings) *Service {
	return &Service{
		db:       db,
		settings: settings,
		registry: NewConnectionRegistry(),
	}
}

func (s *Service) Registry() *ConnectionRegistry {
	return s.registry
}

func (s *Service) Enqueue(req EnqueueRequest) (int, error) {
	if req.Toast.Message == "" {
		return 0, fmt.Errorf("toast.message is required")
	}
	if req.Target.Type == "" {
		return 0, fmt.Errorf("target.type is required")
	}

	ttlSeconds := req.Toast.TTLSeconds
	if ttlSeconds <= 0 {
		ttlSeconds = DefaultTTLSeconds
	}
	expiresAt := time.Now().Add(time.Duration(ttlSeconds) * time.Second)
	payloadJSON, err := marshalPayload(req.Toast.Payload)
	if err != nil {
		return 0, err
	}

	switch req.Target.Type {
	case TargetTypeSession:
		if req.Target.SessionID == "" {
			return 0, fmt.Errorf("target.session_id is required")
		}
		delivery := s.newDelivery(req, payloadJSON, expiresAt, req.Target.SessionID, userPtr(req.Target.UserID))
		if err := s.db.Create(&delivery).Error; err != nil {
			return 0, err
		}
		s.deliverIfOnline(&delivery)
		return 1, nil

	case TargetTypeUser:
		if req.Target.UserID == 0 {
			return 0, fmt.Errorf("target.user_id is required")
		}
		sessionIDs := s.registry.UserSessions(req.Target.UserID)
		if len(sessionIDs) == 0 {
			delivery := s.newDelivery(req, payloadJSON, expiresAt, "", userPtr(req.Target.UserID))
			if err := s.db.Create(&delivery).Error; err != nil {
				return 0, err
			}
			return 1, nil
		}

		deliveries := make([]model.NotificationDelivery, 0, len(sessionIDs))
		for _, sessionID := range sessionIDs {
			deliveries = append(deliveries, s.newDelivery(req, payloadJSON, expiresAt, sessionID, userPtr(req.Target.UserID)))
		}
		if err := s.db.Create(&deliveries).Error; err != nil {
			return 0, err
		}
		for i := range deliveries {
			s.deliverIfOnline(&deliveries[i])
		}
		return len(deliveries), nil

	case TargetTypeBroadcast:
		sessions := s.registry.AllSessions()
		if len(sessions) == 0 {
			return 0, nil
		}

		deliveries := make([]model.NotificationDelivery, 0, len(sessions))
		for _, session := range sessions {
			deliveries = append(deliveries, s.newDelivery(req, payloadJSON, expiresAt, session.SessionID, session.UserID))
		}
		if err := s.db.Create(&deliveries).Error; err != nil {
			return 0, err
		}
		for i := range deliveries {
			s.deliverIfOnline(&deliveries[i])
		}
		return len(deliveries), nil

	default:
		return 0, fmt.Errorf("unsupported target type: %s", req.Target.Type)
	}
}

func (s *Service) ClaimUserPendingDeliveries(userID uint, sessionID string) error {
	if userID == 0 || sessionID == "" {
		return nil
	}

	return s.db.Model(&model.NotificationDelivery{}).
		Where("target_type = ? AND target_user_id = ? AND target_session_id = '' AND status = ? AND expires_at > ?",
			TargetTypeUser, userID, StatusPending, time.Now()).
		Update("target_session_id", sessionID).Error
}

func (s *Service) ReplayPendingDeliveries(sessionID string) error {
	if sessionID == "" {
		return nil
	}

	deliveries, err := s.pendingSessionDeliveries(sessionID)
	if err != nil {
		return err
	}

	for i := range deliveries {
		s.deliverIfOnline(&deliveries[i])
	}

	if len(deliveries) > 0 {
		utils.Info("[Notification] replayed %d pending deliveries for session=%s", len(deliveries), sessionID)
	}

	return nil
}

func (s *Service) PendingDeliveries(identity StreamIdentity) ([]EventPayload, error) {
	deliveries, err := s.pendingSessionDeliveries(identity.SessionID)
	if err != nil {
		return nil, err
	}

	result := make([]EventPayload, 0, len(deliveries))
	for _, delivery := range deliveries {
		payload, err := toEventPayload(delivery)
		if err != nil {
			return nil, err
		}
		result = append(result, payload)
	}

	return result, nil
}

func (s *Service) PanelSummary() (PanelSummary, error) {
	rows, err := s.deliveryStatusCounts()
	if err != nil {
		return PanelSummary{}, err
	}

	summary := PanelSummary{
		OnlineSessions: len(s.registry.Connections()),
	}
	for status, count := range rows {
		switch status {
		case StatusPending:
			summary.PendingCount = count
		case StatusDelivered:
			summary.DeliveredCount = count
		case StatusAcknowledged:
			summary.AcknowledgedCount = count
		case StatusExpired:
			summary.ExpiredCount = count
		}
	}

	return summary, nil
}

func (s *Service) OnlineSessions() []OnlineSession {
	return s.registry.Connections()
}

func (s *Service) ListDeliveries(filter DeliveryFilter) (DeliveryListResult, error) {
	page := filter.Page
	if page <= 0 {
		page = 1
	}

	pageSize := filter.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	query := s.db.Model(&model.NotificationDelivery{})
	if filter.Status != "" {
		query = query.Where("status = ?", filter.Status)
	}
	if filter.TargetType != "" {
		query = query.Where("target_type = ?", filter.TargetType)
	}
	if filter.UserID != nil {
		query = query.Where("target_user_id = ?", *filter.UserID)
	}
	if strings.TrimSpace(filter.SessionID) != "" {
		query = query.Where("target_session_id = ?", strings.TrimSpace(filter.SessionID))
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return DeliveryListResult{}, err
	}

	var deliveries []model.NotificationDelivery
	if err := query.
		Order("created_at DESC, id DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&deliveries).Error; err != nil {
		return DeliveryListResult{}, err
	}

	items := make([]DeliveryRecord, 0, len(deliveries))
	for _, delivery := range deliveries {
		payload, err := unmarshalPayload(delivery.PayloadJSON)
		if err != nil {
			return DeliveryListResult{}, err
		}
		items = append(items, DeliveryRecord{
			DeliveryID:      delivery.DeliveryID,
			SourceService:   delivery.SourceService,
			SourceRequestID: delivery.SourceRequestID,
			TargetType:      delivery.TargetType,
			TargetUserID:    delivery.TargetUserID,
			TargetSessionID: delivery.TargetSessionID,
			Level:           delivery.Level,
			Title:           delivery.Title,
			Message:         delivery.Message,
			Payload:         payload,
			Status:          delivery.Status,
			DedupeKey:       delivery.DedupeKey,
			AttemptCount:    delivery.AttemptCount,
			LastDeliveredAt: delivery.LastDeliveredAt,
			AcknowledgedAt:  delivery.AcknowledgedAt,
			CreatedAt:       delivery.CreatedAt,
			ExpiresAt:       delivery.ExpiresAt,
		})
	}

	return DeliveryListResult{
		Items:    items,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *Service) Ack(deliveryID, sessionID string, userID *uint) error {
	var delivery model.NotificationDelivery
	err := s.db.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("delivery_id = ?", deliveryID).
		First(&delivery).Error
	if err != nil {
		return err
	}

	if delivery.Status == StatusAcknowledged {
		return nil
	}

	if delivery.ExpiresAt.Before(time.Now()) {
		return s.db.Model(&delivery).Updates(map[string]interface{}{
			"status":     StatusExpired,
			"updated_at": time.Now(),
		}).Error
	}

	if delivery.TargetSessionID == "" || delivery.TargetSessionID != sessionID {
		return fmt.Errorf("delivery does not belong to this session")
	}

	if delivery.TargetUserID != nil {
		if userID == nil || *delivery.TargetUserID != *userID {
			return fmt.Errorf("delivery does not belong to this user")
		}
	}

	now := time.Now()
	return s.db.Model(&delivery).Updates(map[string]interface{}{
		"status":          StatusAcknowledged,
		"acknowledged_at": &now,
		"updated_at":      now,
	}).Error
}

func (s *Service) ExpireDeliveries() error {
	return s.db.Model(&model.NotificationDelivery{}).
		Where("status IN ? AND expires_at <= ?", []string{StatusPending, StatusDelivered}, time.Now()).
		Update("status", StatusExpired).Error
}

func (s *Service) deliverIfOnline(delivery *model.NotificationDelivery) {
	if delivery == nil || delivery.TargetSessionID == "" {
		return
	}

	eventPayload, err := toEventPayload(*delivery)
	if err != nil {
		utils.Error("[Notification] failed to build event payload: %v", err)
		return
	}

	if !s.registry.Publish(delivery.TargetSessionID, StreamEvent{
		Event: "notification",
		Data:  eventPayload,
	}) {
		return
	}

	now := time.Now()
	if err := s.db.Model(delivery).Updates(map[string]interface{}{
		"status":            StatusDelivered,
		"attempt_count":     gorm.Expr("attempt_count + 1"),
		"last_delivered_at": &now,
		"updated_at":        now,
	}).Error; err != nil {
		utils.Error("[Notification] failed to mark delivery %s delivered: %v", delivery.DeliveryID, err)
		return
	}

	delivery.Status = StatusDelivered
	delivery.LastDeliveredAt = &now
	delivery.AttemptCount++

	utils.Info("[Notification] delivered notification delivery_id=%s session=%s attempt=%d", delivery.DeliveryID, delivery.TargetSessionID, delivery.AttemptCount)
}

func (s *Service) pendingSessionDeliveries(sessionID string) ([]model.NotificationDelivery, error) {
	if sessionID == "" {
		return nil, nil
	}

	var deliveries []model.NotificationDelivery
	err := s.db.
		Where("target_session_id = ? AND status IN ? AND expires_at > ?", sessionID, []string{StatusPending, StatusDelivered}, time.Now()).
		Order("created_at ASC, id ASC").
		Find(&deliveries).Error
	if err != nil {
		return nil, err
	}
	return deliveries, nil
}

func (s *Service) newDelivery(req EnqueueRequest, payloadJSON string, expiresAt time.Time, sessionID string, userID *uint) model.NotificationDelivery {
	return model.NotificationDelivery{
		DeliveryID:      generateDeliveryID(),
		SourceService:   req.SourceService,
		SourceRequestID: req.SourceRequestID,
		TargetType:      req.Target.Type,
		TargetUserID:    userID,
		TargetSessionID: sessionID,
		Level:           normalizeLevel(req.Toast.Level),
		Title:           req.Toast.Title,
		Message:         req.Toast.Message,
		PayloadJSON:     payloadJSON,
		Status:          StatusPending,
		DedupeKey:       req.Toast.DedupeKey,
		ExpiresAt:       expiresAt,
	}
}

func toEventPayload(delivery model.NotificationDelivery) (EventPayload, error) {
	payload, err := unmarshalPayload(delivery.PayloadJSON)
	if err != nil {
		return EventPayload{}, err
	}

	return EventPayload{
		DeliveryID: delivery.DeliveryID,
		TargetType: delivery.TargetType,
		Level:      delivery.Level,
		Title:      delivery.Title,
		Message:    delivery.Message,
		Payload:    payload,
		CreatedAt:  delivery.CreatedAt,
		ExpiresAt:  delivery.ExpiresAt,
	}, nil
}

func marshalPayload(payload map[string]interface{}) (string, error) {
	if len(payload) == 0 {
		return "{}", nil
	}
	encoded, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}
	return string(encoded), nil
}

func unmarshalPayload(payloadJSON string) (map[string]interface{}, error) {
	if payloadJSON == "" {
		return map[string]interface{}{}, nil
	}

	var payload map[string]interface{}
	if err := json.Unmarshal([]byte(payloadJSON), &payload); err != nil {
		return nil, err
	}
	if payload == nil {
		return map[string]interface{}{}, nil
	}
	return payload, nil
}

func normalizeLevel(level string) string {
	switch level {
	case LevelError, LevelWarning, LevelInfo:
		return level
	default:
		return LevelSuccess
	}
}

func generateDeliveryID() string {
	return fmt.Sprintf("nd_%d_%s", time.Now().UnixNano(), randomHex(8))
}

func userPtr(userID uint) *uint {
	if userID == 0 {
		return nil
	}
	value := userID
	return &value
}

func validateOwnershipErr(err error) bool {
	return err != nil && (errors.Is(err, gorm.ErrRecordNotFound) || err.Error() == "delivery does not belong to this session" || err.Error() == "delivery does not belong to this user")
}

func (s *Service) deliveryStatusCounts() (map[string]int, error) {
	type statusCount struct {
		Status string
		Count  int
	}

	var rows []statusCount
	if err := s.db.Model(&model.NotificationDelivery{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	result := make(map[string]int, len(rows))
	for _, row := range rows {
		result[row.Status] = row.Count
	}
	return result, nil
}
