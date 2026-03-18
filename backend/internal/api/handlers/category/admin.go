package category

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/utils"
)

// AdminGetCategories 管理员获取分类列表（支持分页、搜索）
func AdminGetCategories(c *gin.Context) {
	db := database.GetDB()

	// 获取查询参数
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	search := c.Query("search")

	// 计算偏移量
	offset := (page - 1) * pageSize

	// 构建查询
	query := db.Model(&model.Category{})
	if search != "" {
		query = query.Where("name LIKE ? OR description LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// 获取总数
	var total int64
	if err := query.Count(&total).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	// 获取分类列表
	var categories []model.Category
	if err := query.Order("sort_order ASC, id ASC").Limit(pageSize).Offset(offset).Find(&categories).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	utils.Success(c, gin.H{
		"list":       categories,
		"total":      total,
		"page":       page,
		"page_size":  pageSize,
		"total_page": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// AdminCreateCategory 创建分类
func AdminCreateCategory(c *gin.Context) {
	db := database.GetDB()

	var req struct {
		Name        string `json:"name" binding:"required"`
		Slug        string `json:"slug" binding:"required"`
		Description string `json:"description"`
		ParentID    *uint  `json:"parent_id"`
		SortOrder   int    `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "分类参数错误")
		utils.BadRequest(c, "参数错误："+err.Error())
		return
	}

	// 检查分类名和 slug 是否已存在
	var count int64
	db.Model(&model.Category{}).Where("name = ? OR slug = ?", req.Name, req.Slug).Count(&count)
	if count > 0 {
		notification.QueueWarning(c, "分类名或 slug 已存在")
		utils.BadRequest(c, "分类名或 slug 已存在")
		return
	}

	// 如果有父分类，检查父分类是否存在
	if req.ParentID != nil {
		var parent model.Category
		if err := db.First(&parent, *req.ParentID).Error; err != nil {
			notification.QueueWarning(c, "父分类不存在")
			utils.BadRequest(c, "父分类不存在")
			return
		}
	}

	category := model.Category{
		Name:        req.Name,
		Slug:        req.Slug,
		Description: req.Description,
		ParentID:    req.ParentID,
		SortOrder:   req.SortOrder,
	}

	if err := db.Create(&category).Error; err != nil {
		utils.InternalServerError(c, "创建分类失败")
		return
	}

	notification.QueueSuccess(c, "分类创建成功")
	utils.Success(c, category)
}

// AdminUpdateCategory 更新分类
func AdminUpdateCategory(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var category model.Category
	if err := db.First(&category, id).Error; err != nil {
		notification.QueueWarning(c, "分类不存在")
		utils.NotFound(c, "分类不存在")
		return
	}

	var req struct {
		Name        string `json:"name"`
		Slug        string `json:"slug"`
		Description string `json:"description"`
		ParentID    *uint  `json:"parent_id"`
		SortOrder   int    `json:"sort_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "分类参数错误")
		utils.BadRequest(c, "参数错误："+err.Error())
		return
	}

	// 检查分类名和 slug 是否与其他分类冲突
	if req.Name != "" || req.Slug != "" {
		var count int64
		query := db.Model(&model.Category{}).Where("id != ?", id)
		if req.Name != "" {
			query = query.Where("name = ?", req.Name)
		}
		if req.Slug != "" {
			query = query.Or("slug = ?", req.Slug)
		}
		query.Count(&count)
		if count > 0 {
			notification.QueueWarning(c, "分类名或 slug 与其他分类冲突")
			utils.BadRequest(c, "分类名或 slug 与其他分类冲突")
			return
		}
	}

	// 如果修改了父分类，检查是否会形成循环引用
	if req.ParentID != nil {
		categoryID, _ := strconv.ParseUint(id, 10, 64)
		if *req.ParentID == uint(categoryID) {
			notification.QueueWarning(c, "不能将分类设为自己的子分类")
			utils.BadRequest(c, "不能将分类设为自己的子分类")
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
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.ParentID != nil {
		updates["parent_id"] = req.ParentID
	}
	updates["sort_order"] = req.SortOrder

	if err := db.Model(&category).Updates(updates).Error; err != nil {
		utils.InternalServerError(c, "更新分类失败")
		return
	}

	notification.QueueSuccess(c, "分类更新成功")
	utils.Success(c, category)
}

// AdminDeleteCategory 删除分类
func AdminDeleteCategory(c *gin.Context) {
	db := database.GetDB()
	id := c.Param("id")

	var category model.Category
	if err := db.First(&category, id).Error; err != nil {
		notification.QueueWarning(c, "分类不存在")
		utils.NotFound(c, "分类不存在")
		return
	}

	// 检查是否有文章使用该分类
	var postCount int64
	db.Model(&model.Post{}).Where("category_id = ?", id).Count(&postCount)
	if postCount > 0 {
		notification.QueueWarning(c, "该分类下有文章，无法删除")
		utils.BadRequest(c, "该分类下有文章，无法删除")
		return
	}

	// 检查是否有子分类
	var childCount int64
	db.Model(&model.Category{}).Where("parent_id = ?", id).Count(&childCount)
	if childCount > 0 {
		notification.QueueWarning(c, "该分类下有子分类，无法删除")
		utils.BadRequest(c, "该分类下有子分类，无法删除")
		return
	}

	if err := db.Delete(&category).Error; err != nil {
		utils.InternalServerError(c, "删除分类失败")
		return
	}

	notification.QueueSuccess(c, "分类删除成功")
	utils.Success(c, gin.H{"message": "删除成功"})
}
