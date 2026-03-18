package post

import (
	"errors"

	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

func DeletePost(id uint, authorID uint, isAdmin bool) error {
	db := database.GetDB()

	var post model.Post
	if err := db.First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("文章不存在")
		}
		return errors.New("数据库查询失败")
	}

	if !isAdmin && post.AuthorID != authorID {
		return errors.New("无权删除此文章")
	}

	if err := db.Delete(&post).Error; err != nil {
		return errors.New("文章删除失败")
	}

	return nil
}
