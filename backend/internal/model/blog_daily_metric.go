package model

import "time"

type BlogDailyMetric struct {
	ID             uint      `gorm:"primarykey" json:"id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	MetricDate     time.Time `gorm:"type:date;uniqueIndex" json:"metric_date"`
	NewPosts       int64     `gorm:"default:0" json:"new_posts"`
	NewUsers       int64     `gorm:"default:0" json:"new_users"`
	NewComments    int64     `gorm:"default:0" json:"new_comments"`
	ViewIncrements int64     `gorm:"default:0" json:"view_increments"`
}

func (BlogDailyMetric) TableName() string {
	return "blog_daily_metrics"
}
