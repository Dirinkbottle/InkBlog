package auth

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// Login 用户登录
func Login(c *gin.Context) {
	var req service.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "登录请求参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	response, err := service.Login(req)
	if err != nil {
		if err.Error() == "EMAIL_NOT_VERIFIED" {
			// 获取用户信息用于重发邮件
			db := database.GetDB()
			var user model.User
			db.Where("username = ? OR email = ?", req.Username, req.Username).First(&user)

			notification.QueueWarning(c, "邮箱未验证，请先查收验证邮件")
			c.JSON(400, gin.H{
				"error":                 "邮箱未验证",
				"email":                 user.Email,
				"requires_verification": true,
			})
			return
		}
		notification.QueueWarning(c, err.Error())
		utils.BadRequest(c, err.Error())
		return
	}

	notification.QueueSuccess(c, "登录成功")
	utils.Success(c, response)
}

// RefreshToken 刷新令牌
func RefreshToken(c *gin.Context) {
	var req struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	response, err := service.RefreshToken(req.RefreshToken)
	if err != nil {
		utils.Unauthorized(c, err.Error())
		return
	}

	utils.Success(c, response)
}

// Logout 用户登出
func Logout(c *gin.Context) {
	// 在实际应用中，可以将 token 加入黑名单
	// 这里简单返回成功
	notification.QueueSuccess(c, "登出成功")
	utils.SuccessWithMessage(c, "登出成功", nil)
}
