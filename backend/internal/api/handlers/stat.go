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
	if err := db.Model(&model.Post{}).Where("status = ?", "published").Count(&postCount).Error; err != nil {
		utils.InternalServerError(c, "统计文章数量失败")
		return
	}

	// 统计用户数
	var userCount int64
	if err := db.Model(&model.User{}).Count(&userCount).Error; err != nil {
		utils.InternalServerError(c, "统计用户数量失败")
		return
	}

	// 统计已审核评论数
	var commentCount int64
	if err := db.Model(&model.Comment{}).Where("status = ?", "approved").Count(&commentCount).Error; err != nil {
		utils.InternalServerError(c, "统计评论数量失败")
		return
	}

	// 统计总浏览量
	var totalViews int64
	if err := db.Model(&model.Post{}).Select("COALESCE(SUM(views), 0)").Scan(&totalViews).Error; err != nil {
		utils.InternalServerError(c, "统计浏览量失败")
		return
	}

	utils.Success(c, gin.H{
		"post_count":    postCount,
		"user_count":    userCount,
		"comment_count": commentCount,
		"view_count":    totalViews,
	})
}

