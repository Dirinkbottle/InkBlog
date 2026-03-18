package admin

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// GetPostAttachments 获取文章的附件列表
func GetPostAttachments(c *gin.Context) {
	postID := c.Param("id")
	id, err := strconv.ParseUint(postID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的文章ID")
		return
	}

	attachments, err := service.GetAttachmentsByPostID(uint(id))
	if err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.Success(c, attachments)
}

// DeleteAttachment 删除附件
func DeleteAttachment(c *gin.Context) {
	attachmentID := c.Param("id")
	id, err := strconv.ParseUint(attachmentID, 10, 32)
	if err != nil {
		utils.BadRequest(c, "无效的附件ID")
		return
	}

	userID, _ := c.Get("user_id")
	
	if err := service.DeleteAttachment(uint(id), userID.(uint), true); err != nil {
		utils.InternalServerError(c, err.Error())
		return
	}

	utils.SuccessWithMessage(c, "附件删除成功", nil)
}
