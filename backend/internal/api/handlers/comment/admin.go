package comment

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/utils"
)

// AdminGetComments 管理员获取评论列表（支持筛选）
func AdminGetComments(c *gin.Context) {
	db := database.GetDB()

	// 获取查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	postID := c.Query("post_id")
	search := c.Query("search")

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 构建查询
	query := db.Model(&model.Comment{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if postID != "" {
		query = query.Where("post_id = ?", postID)
	}
	if search != "" {
		query = query.Where("content LIKE ?", "%"+search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	// 获取评论列表（预加载关联数据）
	var comments []model.Comment
	if err := query.Preload("Post").Preload("User").Order("id DESC").Limit(pageSize).Offset(offset).Find(&comments).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	utils.Success(c, gin.H{
		"list":       comments,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_page": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// AdminGetComment 管理员获取单个评论详情
func AdminGetComment(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var comment model.Comment
	if err := db.Preload("Post").Preload("User").First(&comment, id).Error; err != nil {
		notification.QueueWarning(c, "评论不存在")
		utils.NotFound(c, "评论不存在")
		return
	}

	utils.Success(c, comment)
}

// AdminApproveComment 管理员审核通过评论
func AdminApproveComment(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var comment model.Comment
	if err := db.First(&comment, id).Error; err != nil {
		notification.QueueWarning(c, "评论不存在")
		utils.NotFound(c, "评论不存在")
		return
	}

	if err := db.Model(&comment).Update("status", "approved").Error; err != nil {
		utils.InternalServerError(c, "审核失败")
		return
	}

	notification.QueueSuccess(c, "评论审核通过")
	utils.Success(c, gin.H{"message": "审核通过"})
}

// AdminRejectComment 管理员拒绝评论
func AdminRejectComment(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var comment model.Comment
	if err := db.First(&comment, id).Error; err != nil {
		notification.QueueWarning(c, "评论不存在")
		utils.NotFound(c, "评论不存在")
		return
	}

	if err := db.Model(&comment).Update("status", "rejected").Error; err != nil {
		utils.InternalServerError(c, "拒绝失败")
		return
	}

	notification.QueueSuccess(c, "评论已拒绝")
	utils.Success(c, gin.H{"message": "已拒绝"})
}

// AdminDeleteComment 管理员删除评论
func AdminDeleteComment(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var comment model.Comment
	if err := db.First(&comment, id).Error; err != nil {
		notification.QueueWarning(c, "评论不存在")
		utils.NotFound(c, "评论不存在")
		return
	}

	// 检查是否有子评论（回复）
	var childCount int64
	db.Model(&model.Comment{}).Where("parent_id = ?", id).Count(&childCount)
	if childCount > 0 {
		notification.QueueWarning(c, "该评论有回复，无法删除")
		utils.BadRequest(c, "该评论有回复，无法删除")
		return
	}

	if err := db.Delete(&comment).Error; err != nil {
		utils.InternalServerError(c, "删除评论失败")
		return
	}

	notification.QueueSuccess(c, "评论删除成功")
	utils.Success(c, gin.H{"message": "删除成功"})
}
