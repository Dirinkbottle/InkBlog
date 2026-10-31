package post

import (
	"gorm.io/gorm"
	"time"
)

// Only constant SQL fragments may be used for ordering. Empty sort preserves
// the existing administration ordering; public pages explicitly choose newest.
func postListOrder(sort string) string {
	switch sort {
	case "newest":
		return "COALESCE(posts.published_at, posts.created_at) DESC, posts.id DESC"
	case "oldest":
		return "COALESCE(posts.published_at, posts.created_at) ASC, posts.id ASC"
	case "popular":
		return "posts.views DESC, COALESCE(posts.published_at, posts.created_at) DESC, posts.id DESC"
	default:
		return "posts.created_at DESC, posts.id DESC"
	}
}

func applyPublicationWindow(db *gorm.DB, query PostQuery) *gorm.DB {
	if query.Year < 1970 || query.Year > 9998 {
		return db
	}
	start := time.Date(query.Year, time.January, 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(1, 0, 0)
	if query.Month >= 1 && query.Month <= 12 {
		start = time.Date(query.Year, time.Month(query.Month), 1, 0, 0, 0, 0, time.UTC)
		end = start.AddDate(0, 1, 0)
	}
	return db.Where("COALESCE(posts.published_at, posts.created_at) >= ? AND COALESCE(posts.published_at, posts.created_at) < ?", start, end)
}
