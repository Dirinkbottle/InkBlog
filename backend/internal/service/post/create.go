package post

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

func CreatePost(req CreatePostRequest, authorID uint) (*model.PostDetailResponse, error) {
	db := database.GetDB()

	var post model.Post
	maxRetries := 5

	err := db.Transaction(func(tx *gorm.DB) error {
		for attempt := 0; attempt < maxRetries; attempt++ {
			var slug string
			if attempt == 0 {
				slug = generateSlug(req.Title)
			} else {
				slug = fmt.Sprintf("%s-%d", generateSlug(req.Title), attempt)
			}

			post = model.Post{
				Title:      req.Title,
				Slug:       slug,
				Content:    req.Content,
				Summary:    req.Summary,
				CoverImage: req.CoverImage,
				AuthorID:   authorID,
				Status:     req.Status,
			}

			if req.CategoryID > 0 {
				post.CategoryID = req.CategoryID
			}

			if req.Status == "" {
				post.Status = "draft"
			}

			if post.Status == "published" {
				now := time.Now()
				post.PublishedAt = &now
			}

			if err := tx.Create(&post).Error; err != nil {
				if strings.Contains(err.Error(), "Duplicate entry") && strings.Contains(err.Error(), "idx_posts_slug") {
					continue
				}
				return err
			}

			break
		}

		if post.ID == 0 {
			slug := fmt.Sprintf("%s-%d", generateSlug(req.Title), time.Now().UnixNano())
			post.Slug = slug
			if err := tx.Create(&post).Error; err != nil {
				return err
			}
		}

		if len(req.TagIDs) > 0 {
			var tags []model.Tag
			if err := tx.Where("id IN ?", req.TagIDs).Find(&tags).Error; err != nil {
				return err
			}
			if err := tx.Model(&post).Association("Tags").Append(&tags); err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, errors.New("文章创建失败")
	}

	return GetPostByID(post.ID)
}
