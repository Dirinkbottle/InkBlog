package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/utils"
)

// AdminGetTags 管理员获取标签列表（支持分页、搜索）
func AdminGetTags(c *gin.Context) {
	db := database.GetDB()

	// 获取查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 构建查询
	query := db.Model(&model.Tag{})
	if search != "" {
		query = query.Where("name LIKE ?", "%"+search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	// 获取标签列表
	var tags []model.Tag
	if err := query.Order("id DESC").Limit(pageSize).Offset(offset).Find(&tags).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	utils.Success(c, gin.H{
		"list":       tags,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_page": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// AdminCreateTag 创建标签
func AdminCreateTag(c *gin.Context) {
	db := database.GetDB()

	var req struct {
		Name string `json:"name" binding:"required"`
		Slug string `json:"slug" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "标签参数错误")
		utils.BadRequest(c, "参数错误："+err.Error())
		return
	}

	// 检查标签名和 slug 是否已存在
	var count int64
	db.Model(&model.Tag{}).Where("name = ? OR slug = ?", req.Name, req.Slug).Count(&count)
	if count > 0 {
		notification.QueueWarning(c, "标签名或 slug 已存在")
		utils.BadRequest(c, "标签名或 slug 已存在")
		return
	}

	tag := model.Tag{
		Name: req.Name,
		Slug: req.Slug,
	}

	if err := db.Create(&tag).Error; err != nil {
		utils.InternalServerError(c, "创建标签失败")
		return
	}

	notification.QueueSuccess(c, "标签创建成功")
	utils.Success(c, tag)
}

// AdminUpdateTag 更新标签
func AdminUpdateTag(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var tag model.Tag
	if err := db.First(&tag, id).Error; err != nil {
		notification.QueueWarning(c, "标签不存在")
		utils.NotFound(c, "标签不存在")
		return
	}

	var req struct {
		Name string `json:"name"`
		Slug string `json:"slug"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "标签参数错误")
		utils.BadRequest(c, "参数错误："+err.Error())
		return
	}

	// 检查标签名和 slug 是否与其他标签冲突
	if req.Name != "" || req.Slug != "" {
		var count int64
		query := db.Model(&model.Tag{}).Where("id != ?", id)
		if req.Name != "" {
			query = query.Where("name = ?", req.Name)
		}
		if req.Slug != "" {
			query = query.Or("slug = ?", req.Slug)
		}
		query.Count(&count)
		if count > 0 {
			notification.QueueWarning(c, "标签名或 slug 与其他标签冲突")
			utils.BadRequest(c, "标签名或 slug 与其他标签冲突")
			return
		}
	}

	// 更新字段
	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Slug != "" {
		updates["slug"] = req.Slug
	}

	if err := db.Model(&tag).Updates(updates).Error; err != nil {
		utils.InternalServerError(c, "更新标签失败")
		return
	}

	notification.QueueSuccess(c, "标签更新成功")
	utils.Success(c, tag)
}

// AdminDeleteTag 删除标签
func AdminDeleteTag(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var tag model.Tag
	if err := db.First(&tag, id).Error; err != nil {
		notification.QueueWarning(c, "标签不存在")
		utils.NotFound(c, "标签不存在")
		return
	}

	// 检查是否有文章使用该标签
	var posts []model.Post
	if err := db.Model(&tag).Association("Posts").Find(&posts); err != nil {
		utils.InternalServerError(c, "检查标签使用情况失败")
		return
	}

	if len(posts) > 0 {
		notification.QueueWarning(c, "该标签下有文章，无法删除")
		utils.BadRequest(c, "该标签下有文章，无法删除")
		return
	}

	if err := db.Delete(&tag).Error; err != nil {
		utils.InternalServerError(c, "删除标签失败")
		return
	}

	notification.QueueSuccess(c, "标签删除成功")
	utils.Success(c, gin.H{"message": "删除成功"})
}
