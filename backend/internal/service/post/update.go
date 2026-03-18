package post

import (
	"errors"
	"time"

	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

func UpdatePost(id uint, req UpdatePostRequest, authorID uint) (*model.PostDetailResponse, error) {
	db := database.GetDB()

	var post model.Post
	if err := db.Preload("Author").Preload("Category").Preload("Tags").First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("文章不存在")
		}
		return nil, errors.New("数据库查询失败")
	}

	if post.AuthorID != authorID {
		return nil, errors.New("无权修改此文章")
	}

	post.Title = req.Title
	post.Content = req.Content
	post.Summary = req.Summary
	post.CoverImage = req.CoverImage
	post.CategoryID = req.CategoryID

	if post.Status == "draft" && req.Status == "published" {
		now := time.Now()
		post.PublishedAt = &now
	}
	post.Status = req.Status

	err := db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&post).Error; err != nil {
			return err
		}

		if err := tx.Model(&post).Association("Tags").Clear(); err != nil {
			return err
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
		return nil, errors.New("文章更新失败")
	}

	return GetPostByID(id)
}

func PublishPost(id uint, authorID uint, isAdmin bool) error {
	db := database.GetDB()

	var post model.Post
	if err := db.First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("文章不存在")
		}
		return errors.New("数据库查询失败")
	}

	if !isAdmin && post.AuthorID != authorID {
		return errors.New("无权发布此文章")
	}

	if post.Status == "published" {
		return errors.New("文章已发布")
	}

	now := time.Now()
	post.Status = "published"
	post.PublishedAt = &now

	if err := db.Save(&post).Error; err != nil {
		return errors.New("文章发布失败")
	}

	return nil
}
