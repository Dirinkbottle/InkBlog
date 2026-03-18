package category

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

// GetCategories 获取分类列表（公开）
func GetCategories(c *gin.Context) {
	db := database.GetDB()

	var categories []model.Category
	if err := db.Order("sort_order ASC, id ASC").Find(&categories).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	// 为每个分类添加文章数量统计
	type CategoryWithCount struct {
		model.Category
		PostCount int `json:"post_count"`
	}
	
	var categoriesWithCount []CategoryWithCount
	for _, category := range categories {
		var count int64
		db.Model(&model.Post{}).Where("category_id = ? AND status = ?", category.ID, "published").Count(&count)
		categoriesWithCount = append(categoriesWithCount, CategoryWithCount{
			Category:  category,
			PostCount: int(count),
		})
	}

	utils.Success(c, categoriesWithCount)
}

// GetTags 获取标签列表（公开）
func GetTags(c *gin.Context) {
	db := database.GetDB()

	var tags []model.Tag
	if err := db.Order("id DESC").Find(&tags).Error; err != nil {
		utils.InternalServerError(c, "数据库查询失败")
		return
	}

	// 为每个标签添加文章数量统计
	type TagWithCount struct {
		model.Tag
		PostCount int `json:"post_count"`
	}
	
	var tagsWithCount []TagWithCount
	for _, tag := range tags {
		var count int64
		// 通过关联表统计
		db.Table("post_tags").Where("tag_id = ?", tag.ID).
			Joins("INNER JOIN posts ON posts.id = post_tags.post_id AND posts.status = ? AND posts.deleted_at IS NULL", "published").
			Count(&count)
		tagsWithCount = append(tagsWithCount, TagWithCount{
			Tag:       tag,
			PostCount: int(count),
		})
	}

	utils.Success(c, tagsWithCount)
}
