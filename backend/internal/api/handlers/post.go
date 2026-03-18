package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// GetPostList 获取文章列表
func GetPostList(c *gin.Context) {
	var query service.PostQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 对于公开接口，只返回已发布的文章
	if query.Status == "" {
		query.Status = "published"
	}

	result, err := service.GetPostList(query)
	if err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.Success(c, result)
}

// GetPostByID 获取文章详情
func GetPostByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的文章ID")
		return
	}

	post, err := service.GetPostByID(uint(id))
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	// 只允许查看已发布的文章（公开接口）
	if post.Status != "published" {
		utils.NotFound(c, "文章不存在")
		return
	}

	utils.Success(c, post)
}

// GetPostBySlug 通过 slug 获取文章
func GetPostBySlug(c *gin.Context) {
	slug := c.Param("slug")

	post, err := service.GetPostBySlug(slug)
	if err != nil {
		utils.NotFound(c, err.Error())
		return
	}

	// 只允许查看已发布的文章（公开接口）
	if post.Status != "published" {
		utils.NotFound(c, "文章不存在")
		return
	}

	utils.Success(c, post)
}

