package auth

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// VerifyEmail 验证邮箱
func VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		utils.BadRequest(c, "验证令牌不能为空")
		return
	}

	db := database.GetDB()
	var user model.User

	if err := db.Where("email_verification_token = ?", token).First(&user).Error; err != nil {
		utils.BadRequest(c, "无效的验证令牌")
		return
	}

	// 检查是否已验证
	if user.IsEmailVerified {
		utils.Success(c, gin.H{"message": "邮箱已经验证过了"})
		return
	}

	// 检查令牌是否过期
	expiryHours := 24
	if hours, err := strconv.Atoi(service.GetSetting("email_verification_expiry_hours", "24")); err == nil {
		expiryHours = hours
	}

	if user.EmailVerificationSentAt == nil || time.Since(*user.EmailVerificationSentAt) > time.Duration(expiryHours)*time.Hour {
		utils.BadRequest(c, "验证链接已过期，请重新发送验证邮件")
		return
	}

	// 更新用户状态
	user.IsEmailVerified = true
	user.EmailVerificationToken = ""
	user.EmailVerificationSentAt = nil

	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "验证失败")
		return
	}

	utils.Info("User email verified: %s", user.Email)
	utils.Success(c, gin.H{"message": "邮箱验证成功，现在可以登录了"})
}

// ResendVerificationEmail 重新发送验证邮件
func ResendVerificationEmail(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "请求参数错误")
		utils.BadRequest(c, "请求参数错误")
		return
	}

	db := database.GetDB()
	var user model.User

	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.BadRequest(c, "用户不存在")
		return
	}

	// 检查是否已验证
	if user.IsEmailVerified {
		notification.QueueWarning(c, "邮箱已经验证过了")
		utils.BadRequest(c, "邮箱已经验证过了")
		return
	}

	// 生成新的验证令牌
	token, err := utils.GenerateVerificationToken()
	if err != nil {
		utils.InternalServerError(c, "生成验证令牌失败")
		return
	}

	user.EmailVerificationToken = token
	now := time.Now()
	user.EmailVerificationSentAt = &now

	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "更新用户信息失败")
		return
	}

	// 发送验证邮件
	go func() {
		// 获取邮件配置
		allSettings, err := service.GetAllSettings()
		if err != nil {
			utils.Error("Failed to get settings: %v", err)
			return
		}

		// 获取邮箱验证基础URL
		baseURL := allSettings["email_verification_base_url"]
		if baseURL == "" {
			baseURL = "https://dirinkbottle.asia"
		}

		// 获取过期时间
		expiryHours := 24
		if expiry := allSettings["email_verification_expiry_hours"]; expiry != "" {
			if hours, err := strconv.Atoi(expiry); err == nil {
				expiryHours = hours
			}
		}

		port := 587
		if p, err := strconv.Atoi(allSettings["email_smtp_port"]); err == nil {
			port = p
		}

		emailConfig := &utils.EmailConfig{
			SMTPHost:    allSettings["email_smtp_host"],
			SMTPPort:    port,
			Username:    allSettings["email_smtp_username"],
			Password:    allSettings["email_smtp_password"],
			FromAddress: allSettings["email_from_address"],
			FromName:    allSettings["email_from_name"],
			Library:     allSettings["email_library"],
		}

		if emailConfig.Library == "" {
			emailConfig.Library = "gomail"
		}

		if err := utils.SendVerificationEmail(emailConfig, user.Username, user.Email, token, baseURL, expiryHours); err != nil {
			utils.Error("Failed to send verification email: %v", err)
		} else {
			utils.Info("Verification email resent to: %s", user.Email)
		}
	}()

	notification.QueueSuccess(c, "验证邮件已重新发送")
	utils.Success(c, gin.H{"message": "验证邮件已重新发送"})
}
