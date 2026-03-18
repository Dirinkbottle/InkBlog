package auth

import (
	"errors"
	"strconv"
	"time"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

func Register(req RegisterRequest) (*model.User, error) {
	db := database.GetDB()

	var existingUser model.User
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		if existingUser.IsEmailVerified {
			return nil, errors.New("用户名已存在")
		}
	}

	var emailUser model.User
	if err := db.Where("email = ?", req.Email).First(&emailUser).Error; err == nil {
		if !emailUser.IsEmailVerified {
			token, err := utils.GenerateVerificationToken()
			if err != nil {
				return nil, errors.New("生成验证令牌失败")
			}

			hashedPassword, err := utils.HashPassword(req.Password)
			if err != nil {
				return nil, errors.New("密码加密失败")
			}

			emailUser.Password = hashedPassword
			emailUser.EmailVerificationToken = token
			emailUser.EmailVerificationSentAt = time.Now()

			if err := db.Save(&emailUser).Error; err != nil {
				return nil, errors.New("更新用户信息失败")
			}

			utils.Info("Resending verification email for existing unverified user: %s", emailUser.Email)

			go sendVerificationEmail(&emailUser, token)

			return &emailUser, nil
		}
		return nil, errors.New("邮箱已被注册")
	}

	emailVerificationEnabled := getSetting("email_verification_enabled", "true") == "true"

	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	verificationToken := ""
	var verificationSentAt time.Time
	if emailVerificationEnabled {
		token, err := utils.GenerateVerificationToken()
		if err != nil {
			return nil, errors.New("生成验证令牌失败")
		}
		verificationToken = token
		verificationSentAt = time.Now()
	}

	user := model.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     "user",
		Status:   "active",
		Permissions: model.UserPermissions{
			CanComment: true,
		},
		IsEmailVerified:         !emailVerificationEnabled,
		EmailVerificationToken:  verificationToken,
		EmailVerificationSentAt: verificationSentAt,
	}

	if err := db.Create(&user).Error; err != nil {
		return nil, errors.New("用户创建失败")
	}

	utils.Info("User registered successfully: %s (email_verified: %v)", user.Username, user.IsEmailVerified)

	if emailVerificationEnabled {
		go sendVerificationEmail(&user, verificationToken)
	}

	return &user, nil
}

func sendVerificationEmail(user *model.User, token string) {
	baseURL := getSetting("email_verification_base_url", "https://dirinkbottle.asia")

	expiryHours := 24
	if hours, err := strconv.Atoi(getSetting("email_verification_expiry_hours", "24")); err == nil {
		expiryHours = hours
	}

	emailConfig, err := getEmailConfig()
	if err != nil {
		utils.Error("Failed to get email config: %v", err)
		return
	}

	if err := utils.SendVerificationEmail(emailConfig, user.Username, user.Email, token, baseURL, expiryHours); err != nil {
		utils.Error("Failed to send verification email: %v", err)
	} else {
		utils.Info("Verification email sent to: %s", user.Email)
	}
}
