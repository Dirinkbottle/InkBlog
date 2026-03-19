package database

import (
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"inkblog-backend/internal/model"
)

func EnsureAnalyticsSchema() error {
	if DB == nil {
		return fmt.Errorf("database is not initialized")
	}

	if err := DB.AutoMigrate(&model.BlogDailyMetric{}); err != nil {
		return fmt.Errorf("failed to migrate blog_daily_metrics: %w", err)
	}

	return nil
}

func RecordBlogViewIncrement(at time.Time) error {
	if DB == nil {
		return fmt.Errorf("database is not initialized")
	}

	now := time.Now()
	metricDate := startOfDay(at)

	return DB.Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "metric_date"}},
		DoUpdates: clause.Assignments(map[string]interface{}{
			"view_increments": gorm.Expr("view_increments + ?", 1),
			"updated_at":      now,
		}),
	}).Create(&model.BlogDailyMetric{
		MetricDate:     metricDate,
		ViewIncrements: 1,
		CreatedAt:      now,
		UpdatedAt:      now,
	}).Error
}

func startOfDay(value time.Time) time.Time {
	local := value.In(time.Local)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, time.Local)
}
