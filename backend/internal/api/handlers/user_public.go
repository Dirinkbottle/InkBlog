package handlers

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
	"strconv"
)

// GetPublicUserProfile 获取用户公开资料
func GetPublicUserProfile(c *gin.Context) {
	userID := c.Param("id")
	id, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	db := database.GetDB()
	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	var publishedPostCount int64
	if err := db.Model(&model.Post{}).
		Where("author_id = ? AND status = ?", id, "published").
		Count(&publishedPostCount).Error; err != nil {
		utils.Warn("count published posts for public profile failed: user_id=%d err=%v", id, err)
		publishedPostCount = 0
	}

	// 只返回公开信息（不包含邮箱等敏感信息）
	utils.Success(c, gin.H{
		"id":            user.ID,
		"username":      user.Username,
		"display_name":  user.DisplayName,
		"bio":           user.Bio,
		"avatar_base64": user.AvatarBase64,
		"created_at":    user.CreatedAt,
		"published_post_count": publishedPostCount,
	})
}

// GetPublicUserPosts 获取用户的公开文章列表
func GetPublicUserPosts(c *gin.Context) {
	userID := c.Param("id")
	id, err := strconv.ParseUint(userID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	// 检查用户是否存在
	db := database.GetDB()
	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	// 获取分页参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	// 只获取该用户已发布的文章
	query := service.PostQuery{
		Page:     page,
		PageSize: pageSize,
		Status:   "published",
		AuthorID: uint(id),
	}

	result, err := service.GetPostList(query)
	if err != nil {
		utils.InternalServerError(c, "获取文章列表失败")
		return
	}

	utils.Success(c, gin.H{
		"user": gin.H{
			"id":           user.ID,
			"username":     user.Username,
			"display_name": user.DisplayName,
		},
		"posts": result,
	})
}
