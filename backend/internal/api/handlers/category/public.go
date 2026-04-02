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

	var categoryRows []struct {
		CategoryID uint  `gorm:"column:category_id"`
		Count      int64 `gorm:"column:count"`
	}
	if err := db.Model(&model.Post{}).
		Select("category_id, COUNT(*) AS count").
		Where("status = ? AND deleted_at IS NULL", "published").
		Group("category_id").
		Scan(&categoryRows).Error; err != nil {
		utils.InternalServerError(c, "分类统计失败")
		return
	}
	categoryCountMap := make(map[uint]int64, len(categoryRows))
	for _, row := range categoryRows {
		categoryCountMap[row.CategoryID] = row.Count
	}

	categoriesWithCount := make([]CategoryWithCount, 0, len(categories))
	for _, category := range categories {
		categoriesWithCount = append(categoriesWithCount, CategoryWithCount{
			Category:  category,
			PostCount: int(categoryCountMap[category.ID]),
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

	var tagRows []struct {
		TagID  uint  `gorm:"column:tag_id"`
		Count  int64 `gorm:"column:count"`
	}
	if err := db.Table("post_tags").
		Select("post_tags.tag_id, COUNT(*) AS count").
		Joins("INNER JOIN posts ON posts.id = post_tags.post_id AND posts.status = ? AND posts.deleted_at IS NULL", "published").
		Group("post_tags.tag_id").
		Scan(&tagRows).Error; err != nil {
		utils.InternalServerError(c, "标签统计失败")
		return
	}
	tagCountMap := make(map[uint]int64, len(tagRows))
	for _, row := range tagRows {
		tagCountMap[row.TagID] = row.Count
	}

	tagsWithCount := make([]TagWithCount, 0, len(tags))
	for _, tag := range tags {
		tagsWithCount = append(tagsWithCount, TagWithCount{
			Tag:       tag,
			PostCount: int(tagCountMap[tag.ID]),
		})
	}

	utils.Success(c, tagsWithCount)
}
