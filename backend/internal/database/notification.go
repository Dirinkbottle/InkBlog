package database

import (
	"fmt"

	"inkblog-backend/internal/model"
)

func EnsureNotificationSchema() error {
	if DB == nil {
		return fmt.Errorf("database is not initialized")
	}

	if err := DB.AutoMigrate(&model.NotificationDelivery{}); err != nil {
		return fmt.Errorf("failed to migrate notification_deliveries: %w", err)
	}

	return nil
}
