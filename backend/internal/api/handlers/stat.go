package handlers

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

// GetStatistics 获取网站统计信息
func GetStatistics(c *gin.Context) {
	db := database.GetDB()

	// 统计已发布文章数
	var postCount int64
	db.Model(&model.Post{}).Where("status = ?", "published").Count(&postCount)

	// 统计用户数
	var userCount int64
	db.Model(&model.User{}).Count(&userCount)

	// 统计已审核评论数
	var commentCount int64
	db.Model(&model.Comment{}).Where("status = ?", "approved").Count(&commentCount)

	// 统计总浏览量
	var totalViews int64
	db.Model(&model.Post{}).Select("COALESCE(SUM(views), 0)").Scan(&totalViews)

	utils.Success(c, gin.H{
		"post_count":    postCount,
		"user_count":    userCount,
		"comment_count": commentCount,
		"view_count":    totalViews,
	})
}

