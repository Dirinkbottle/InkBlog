package handlers

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// UserGetPosts 获取当前用户的文章列表
func UserGetPosts(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var query service.PostQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	// 强制过滤：只返回当前用户的文章
	query.AuthorID = userID.(uint)

	result, err := service.GetPostList(query)
	if err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.Success(c, result)
}

// UserGetPost 获取当前用户的单篇文章
func UserGetPost(c *gin.Context) {
	userID, _ := c.Get("user_id")
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

	// 检查是否是自己的文章
	if post.Author.ID != userID.(uint) {
		utils.Forbidden(c, "您只能查看自己的文章")
		return
	}

	utils.Success(c, post)
}

// UserGetPostAttachments 获取用户文章的附件列表
func UserGetPostAttachments(c *gin.Context) {
	userID, _ := c.Get("user_id")
	postID := c.Param("id")
	id, err := strconv.ParseUint(postID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的文章ID")
		return
	}

	// 验证文章归属
	post, err := service.GetPostByID(uint(id))
	if err != nil {
		utils.NotFound(c, "文章不存在")
		return
	}

	if post.Author.ID != userID.(uint) {
		utils.Forbidden(c, "您只能查看自己文章的附件")
		return
	}

	attachments, err := service.GetAttachmentsByPostID(uint(id))
	if err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.Success(c, attachments)
}

// UserDeleteAttachment 删除用户的附件
func UserDeleteAttachment(c *gin.Context) {
	attachmentID := c.Param("id")
	id, err := strconv.ParseUint(attachmentID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的附件ID")
		return
	}

	userID, _ := c.Get("user_id")
	
	// 用户只能删除自己的附件
	if err := service.DeleteAttachment(uint(id), userID.(uint), false); err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.SuccessWithMessage(c, "附件删除成功", nil)
}