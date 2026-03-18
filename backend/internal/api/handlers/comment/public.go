package comment

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// GetPostComments 获取文章的评论列表（公开接口）
func GetPostComments(c *gin.Context) {
	db := database.GetDB()
	postID := c.Param("postId")

	// 获取分页参数
	page := 1
	pageSize := 10
	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil && parsed > 0 {
			page = parsed
		}
	}
	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil && parsed > 0 && parsed <= 50 {
			pageSize = parsed
		}
	}

	utils.Info("Fetching comments for post ID: %s (page=%d, size=%d)", postID, page, pageSize)

	// 统计总数
	var total int64
	if err := db.Model(&model.Comment{}).
		Where("post_id = ? AND status = ?", postID, "approved").
		Count(&total).Error; err != nil {
		utils.Error("Failed to count comments for post %s: %v", postID, err)
		utils.InternalServerError(c, "获取评论失败")
		return
	}

	// 分页查询评论
	var comments []model.Comment
	offset := (page - 1) * pageSize
	if err := db.Preload("User").
		Where("post_id = ? AND status = ?", postID, "approved").
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&comments).Error; err != nil {
		utils.Error("Failed to fetch comments for post %s: %v", postID, err)
		utils.InternalServerError(c, "获取评论失败")
		return
	}

	totalPages := (int(total) + pageSize - 1) / pageSize

	utils.Info("Found %d/%d approved comments for post %s (page %d/%d)", len(comments), total, postID, page, totalPages)
	utils.Success(c, gin.H{
		"comments":    comments,
		"total":       total,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": totalPages,
	})
}

// CreateComment 创建评论（公开接口，需要认证）
func CreateComment(c *gin.Context) {
	db := database.GetDB()

	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		notification.QueueWarning(c, "请先登录")
		utils.Unauthorized(c, "请先登录")
		return
	}

	// 绑定请求数据
	var req struct {
		PostID   uint   `json:"post_id" binding:"required"`
		Content  string `json:"content" binding:"required,min=1,max=1000"`
		ParentID *uint  `json:"parent_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "评论参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	utils.Info("User %v creating comment for post %d", userID, req.PostID)

	// 检查用户是否有评论权限
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		utils.Error("Failed to fetch user %v: %v", userID, err)
		notification.QueueWarning(c, "用户不存在")
		utils.Unauthorized(c, "用户不存在")
		return
	}

	if !user.Permissions.CanComment {
		utils.Warn("User %d (%s) attempted to comment without permission", user.ID, user.Username)
		notification.QueueWarning(c, "您没有评论权限")
		utils.Forbidden(c, "您没有评论权限")
		return
	}

	// 检查文章是否存在
	var post model.Post
	if err := db.First(&post, req.PostID).Error; err != nil {
		utils.Warn("Comment attempted on non-existent post %d", req.PostID)
		notification.QueueWarning(c, "文章不存在")
		utils.NotFound(c, "文章不存在")
		return
	}

	// 如果是回复评论，检查父评论是否存在
	if req.ParentID != nil {
		var parentComment model.Comment
		if err := db.First(&parentComment, *req.ParentID).Error; err != nil {
			utils.Warn("Reply attempted to non-existent comment %d", *req.ParentID)
			notification.QueueWarning(c, "父评论不存在")
			utils.BadRequest(c, "父评论不存在")
			return
		}
	}

	// 获取评论审核设置
	autoApprove := service.GetSetting("comment_auto_approve", "false") == "true"

	// 决定评论状态：自动审核开启 OR 用户有免审权限 OR 用户是管理员
	commentStatus := "pending"
	if autoApprove || user.Permissions.CanCommentWithoutApproval || user.Role == "admin" {
		commentStatus = "approved"
	}

	// 创建评论
	uid := userID.(uint)
	comment := model.Comment{
		PostID:    req.PostID,
		UserID:    &uid,
		ParentID:  req.ParentID,
		Content:   req.Content,
		Status:    commentStatus,
		IP:        c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}

	if err := db.Create(&comment).Error; err != nil {
		utils.Error("Failed to create comment: %v", err)
		utils.InternalServerError(c, "评论发表失败")
		return
	}

	// 预加载用户信息
	db.Preload("User").First(&comment, comment.ID)

	utils.Info("Comment created successfully: ID=%d, User=%d, Post=%d, Status=%s", comment.ID, user.ID, req.PostID, comment.Status)

	message := "评论已提交，等待审核"
	if comment.Status == "approved" {
		message = "评论已发表"
	}

	notification.QueueSuccess(c, message)
	utils.Success(c, gin.H{
		"comment": comment,
		"message": message,
	})
}
