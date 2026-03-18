package admin

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/notification"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// GetPostList 管理员获取文章列表
func GetPostList(c *gin.Context) {
	var query service.PostQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	result, err := service.GetPostList(query)
	if err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.Success(c, result)
}

// CreatePost 创建文章
func CreatePost(c *gin.Context) {
	var req service.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "创建文章参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	post, err := service.CreatePost(req, userID.(uint))
	if err != nil {
		notification.QueueWarning(c, err.Error())
		utils.BadRequest(c, err.Error())
		return
	}

	notification.QueueSuccess(c, "文章创建成功")
	utils.SuccessWithMessage(c, "文章创建成功", post)
}

// UpdatePost 更新文章
func UpdatePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的文章ID")
		utils.BadRequest(c, "无效的文章ID")
		return
	}

	var req service.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "更新文章参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	userID, _ := c.Get("user_id")

	post, err := service.UpdatePost(uint(id), req, userID.(uint))
	if err != nil {
		notification.QueueWarning(c, err.Error())
		utils.BadRequest(c, err.Error())
		return
	}

	notification.QueueSuccess(c, "文章更新成功")
	utils.SuccessWithMessage(c, "文章更新成功", post)
}

// DeletePost 删除文章
func DeletePost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的文章ID")
		utils.BadRequest(c, "无效的文章ID")
		return
	}

	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	isAdmin := role == "admin"

	if err := service.DeletePost(uint(id), userID.(uint), isAdmin); err != nil {
		notification.QueueWarning(c, err.Error())
		utils.BadRequest(c, err.Error())
		return
	}

	notification.QueueSuccess(c, "文章删除成功")
	utils.SuccessWithMessage(c, "文章删除成功", nil)
}

// PublishPost 发布文章
func PublishPost(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的文章ID")
		utils.BadRequest(c, "无效的文章ID")
		return
	}

	userID, _ := c.Get("user_id")
	role, _ := c.Get("role")
	isAdmin := role == "admin"

	if err := service.PublishPost(uint(id), userID.(uint), isAdmin); err != nil {
		notification.QueueWarning(c, err.Error())
		utils.BadRequest(c, err.Error())
		return
	}

	notification.QueueSuccess(c, "文章发布成功")
	utils.SuccessWithMessage(c, "文章发布成功", nil)
}
