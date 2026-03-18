package post

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"inkblog-backend/internal/model"
)

func generateSlug(title string) string {
	slug := strings.ToLower(title)
	slug = strings.ReplaceAll(slug, " ", "-")
	return slug
}

func generateUniqueSlug(db *gorm.DB, title string) string {
	baseSlug := generateSlug(title)
	slug := baseSlug
	counter := 1

	for {
		var existingPost model.Post
		err := db.Where("slug = ?", slug).First(&existingPost).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			return slug
		}

		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
		counter++

		if counter > 100 {
			slug = fmt.Sprintf("%s-%d", baseSlug, time.Now().UnixNano())
			return slug
		}
	}
}
