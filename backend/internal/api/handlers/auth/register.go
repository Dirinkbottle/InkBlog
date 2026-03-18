package auth

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/notification"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// Register 用户注册
func Register(c *gin.Context) {
	var req service.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "注册请求参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	user, err := service.Register(req)
	if err != nil {
		notification.QueueWarning(c, err.Error())
		utils.BadRequest(c, err.Error())
		return
	}

	// 如果需要邮箱验证，返回提示信息
	if !user.IsEmailVerified {
		// 获取过期时间设置
		expiryHours := 24
		if hours, err := strconv.Atoi(service.GetSetting("email_verification_expiry_hours", "24")); err == nil {
			expiryHours = hours
		}

		notification.QueueSuccess(c, "注册成功，请查收验证邮件")
		utils.Success(c, gin.H{
			"message":               "注册成功，请查收验证邮件",
			"email":                 user.Email,
			"requires_verification": true,
			"expiry_hours":          expiryHours,
		})
		return
	}

	// 如果不需要验证，正常返回token
	response, _ := service.Login(service.LoginRequest{
		Username: user.Email,
		Password: req.Password,
	})

	notification.QueueSuccess(c, "注册成功")
	utils.Success(c, response)
}
