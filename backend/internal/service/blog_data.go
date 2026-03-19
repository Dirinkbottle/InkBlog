package service

import (
	"fmt"
	"time"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

const (
	BlogTrendRangeDays  = 14
	BlogRecentPostLimit = 5
)

type TrendPoint struct {
	Date  string `json:"date"`
	Value int64  `json:"value"`
}

type BlogDataTotals struct {
	PostCount    int64 `json:"post_count"`
	ViewCount    int64 `json:"view_count"`
	UserCount    int64 `json:"user_count"`
	CommentCount int64 `json:"comment_count"`
}

type BlogDataTrends struct {
	Posts    []TrendPoint `json:"posts"`
	Views    []TrendPoint `json:"views"`
	Users    []TrendPoint `json:"users"`
	Comments []TrendPoint `json:"comments"`
}

type BlogRecentPostItem struct {
	ID           uint       `json:"id"`
	Title        string     `json:"title"`
	Status       string     `json:"status"`
	Views        int        `json:"views"`
	CommentCount int64      `json:"comment_count"`
	CreatedAt    time.Time  `json:"created_at"`
	PublishedAt  *time.Time `json:"published_at,omitempty"`
}

type BlogDataMeta struct {
	RangeDays  int    `json:"range_days"`
	ViewsSince string `json:"views_since"`
}

type BlogDataOverview struct {
	Totals      BlogDataTotals       `json:"totals"`
	Trends      BlogDataTrends       `json:"trends"`
	RecentPosts []BlogRecentPostItem `json:"recent_posts"`
	Meta        BlogDataMeta         `json:"meta"`
}

type dailyCountRow struct {
	MetricDate string `gorm:"column:metric_date"`
	Count      int64  `gorm:"column:count"`
}

type recentPostRow struct {
	ID           uint       `json:"id"`
	Title        string     `json:"title"`
	Status       string     `json:"status"`
	Views        int        `json:"views"`
	CommentCount int64      `json:"comment_count"`
	CreatedAt    time.Time  `json:"created_at"`
	PublishedAt  *time.Time `json:"published_at"`
}

func GetBlogDataOverview(rangeDays, recentLimit int) (*BlogDataOverview, error) {
	db := database.GetDB()
	if db == nil {
		return nil, fmt.Errorf("database is not initialized")
	}

	if rangeDays <= 0 {
		rangeDays = BlogTrendRangeDays
	}
	if recentLimit <= 0 {
		recentLimit = BlogRecentPostLimit
	}

	if err := SyncRecentBlogDailyMetrics(rangeDays); err != nil {
		return nil, err
	}

	totals, err := loadBlogDataTotals(db)
	if err != nil {
		return nil, err
	}

	trends, err := loadBlogDataTrends(db, rangeDays)
	if err != nil {
		return nil, err
	}

	recentPosts, err := loadRecentBlogPosts(db, recentLimit)
	if err != nil {
		return nil, err
	}

	viewsSince, err := resolveViewsSince(db)
	if err != nil {
		return nil, err
	}

	return &BlogDataOverview{
		Totals:      totals,
		Trends:      trends,
		RecentPosts: recentPosts,
		Meta: BlogDataMeta{
			RangeDays:  rangeDays,
			ViewsSince: viewsSince,
		},
	}, nil
}

func SyncRecentBlogDailyMetrics(rangeDays int) error {
	db := database.GetDB()
	if db == nil {
		return fmt.Errorf("database is not initialized")
	}

	startDate, endDate := blogMetricWindow(rangeDays)

	postCounts, err := queryDailyCounts(
		db.Model(&model.Post{}).Where("status = ?", "published"),
		startDate,
		endDate,
	)
	if err != nil {
		return fmt.Errorf("failed to collect post trend: %w", err)
	}

	userCounts, err := queryDailyCounts(
		db.Model(&model.User{}),
		startDate,
		endDate,
	)
	if err != nil {
		return fmt.Errorf("failed to collect user trend: %w", err)
	}

	commentCounts, err := queryDailyCounts(
		db.Model(&model.Comment{}).Where("status = ?", "approved"),
		startDate,
		endDate,
	)
	if err != nil {
		return fmt.Errorf("failed to collect comment trend: %w", err)
	}

	now := time.Now()
	metrics := make([]model.BlogDailyMetric, 0, rangeDays)
	for date := startDate; date.Before(endDate); date = date.Add(24 * time.Hour) {
		key := date.Format("2006-01-02")
		metrics = append(metrics, model.BlogDailyMetric{
			MetricDate:  date,
			NewPosts:    postCounts[key],
			NewUsers:    userCounts[key],
			NewComments: commentCounts[key],
			CreatedAt:   now,
			UpdatedAt:   now,
		})
	}

	return db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "metric_date"}},
		DoUpdates: clause.AssignmentColumns([]string{"new_posts", "new_users", "new_comments", "updated_at"}),
	}).Create(&metrics).Error
}

func loadBlogDataTotals(db *gorm.DB) (BlogDataTotals, error) {
	var totals BlogDataTotals

	if err := db.Model(&model.Post{}).Where("status = ?", "published").Count(&totals.PostCount).Error; err != nil {
		return totals, err
	}
	if err := db.Model(&model.User{}).Count(&totals.UserCount).Error; err != nil {
		return totals, err
	}
	if err := db.Model(&model.Comment{}).Where("status = ?", "approved").Count(&totals.CommentCount).Error; err != nil {
		return totals, err
	}
	if err := db.Model(&model.Post{}).Select("COALESCE(SUM(views), 0)").Scan(&totals.ViewCount).Error; err != nil {
		return totals, err
	}

	return totals, nil
}

func loadBlogDataTrends(db *gorm.DB, rangeDays int) (BlogDataTrends, error) {
	startDate, endDate := blogMetricWindow(rangeDays)

	var rows []model.BlogDailyMetric
	if err := db.
		Where("metric_date >= ? AND metric_date < ?", startDate, endDate).
		Order("metric_date ASC").
		Find(&rows).Error; err != nil {
		return BlogDataTrends{}, err
	}

	byDate := make(map[string]model.BlogDailyMetric, len(rows))
	for _, row := range rows {
		byDate[row.MetricDate.Format("2006-01-02")] = row
	}

	trends := BlogDataTrends{
		Posts:    make([]TrendPoint, 0, rangeDays),
		Views:    make([]TrendPoint, 0, rangeDays),
		Users:    make([]TrendPoint, 0, rangeDays),
		Comments: make([]TrendPoint, 0, rangeDays),
	}

	for date := startDate; date.Before(endDate); date = date.Add(24 * time.Hour) {
		key := date.Format("2006-01-02")
		row := byDate[key]
		trends.Posts = append(trends.Posts, TrendPoint{Date: key, Value: row.NewPosts})
		trends.Views = append(trends.Views, TrendPoint{Date: key, Value: row.ViewIncrements})
		trends.Users = append(trends.Users, TrendPoint{Date: key, Value: row.NewUsers})
		trends.Comments = append(trends.Comments, TrendPoint{Date: key, Value: row.NewComments})
	}

	return trends, nil
}

func loadRecentBlogPosts(db *gorm.DB, limit int) ([]BlogRecentPostItem, error) {
	var rows []recentPostRow

	if err := db.Model(&model.Post{}).
		Select(`
			posts.id,
			posts.title,
			posts.status,
			posts.views,
			posts.created_at,
			posts.published_at,
			(
				SELECT COUNT(*)
				FROM comments
				WHERE comments.post_id = posts.id
					AND comments.status = 'approved'
					AND comments.deleted_at IS NULL
			) AS comment_count
		`).
		Order("posts.created_at DESC").
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	items := make([]BlogRecentPostItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, BlogRecentPostItem{
			ID:           row.ID,
			Title:        row.Title,
			Status:       row.Status,
			Views:        row.Views,
			CommentCount: row.CommentCount,
			CreatedAt:    row.CreatedAt,
			PublishedAt:  row.PublishedAt,
		})
	}

	return items, nil
}

func resolveViewsSince(db *gorm.DB) (string, error) {
	var metricDate time.Time
	err := db.Model(&model.BlogDailyMetric{}).
		Select("metric_date").
		Where("view_increments > 0").
		Order("metric_date ASC").
		Limit(1).
		Scan(&metricDate).Error
	if err != nil {
		return "", err
	}
	if metricDate.IsZero() {
		return startOfLocalDay(time.Now()).Format("2006-01-02"), nil
	}
	return metricDate.Format("2006-01-02"), nil
}

func queryDailyCounts(query *gorm.DB, startDate, endDate time.Time) (map[string]int64, error) {
	var rows []dailyCountRow
	if err := query.
		Select("DATE(created_at) AS metric_date, COUNT(*) AS count").
		Where("created_at >= ? AND created_at < ?", startDate, endDate).
		Group("DATE(created_at)").
		Scan(&rows).Error; err != nil {
		return nil, err
	}

	result := make(map[string]int64, len(rows))
	for _, row := range rows {
		result[row.MetricDate] = row.Count
	}

	return result, nil
}

func blogMetricWindow(rangeDays int) (time.Time, time.Time) {
	today := startOfLocalDay(time.Now())
	startDate := today.AddDate(0, 0, -(rangeDays - 1))
	endDate := today.AddDate(0, 0, 1)
	return startDate, endDate
}

func startOfLocalDay(value time.Time) time.Time {
	local := value.In(time.Local)
	return time.Date(local.Year(), local.Month(), local.Day(), 0, 0, 0, 0, time.Local)
}
