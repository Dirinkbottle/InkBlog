package auth

import (
	"errors"

	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

func Login(req LoginRequest) (*AuthResponse, error) {
	db := database.GetDB()

	var user model.User
	if err := db.Where("username = ? OR email = ?", req.Username, req.Username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户名/邮箱或密码错误")
		}
		return nil, errors.New("数据库查询失败")
	}

	if !utils.CheckPassword(user.Password, req.Password) {
		return nil, errors.New("用户名/邮箱或密码错误")
	}

	if user.Status == "banned" {
		return nil, errors.New("您的账号已被封禁，无法登录")
	}

	if !user.IsEmailVerified {
		return nil, errors.New("EMAIL_NOT_VERIFIED")
	}

	token, err := utils.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, errors.New("token 生成失败")
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, errors.New("refresh token 生成失败")
	}

	utils.Info("User logged in successfully: %s", user.Username)

	return &AuthResponse{
		User:         user.ToResponse(),
		Token:        token,
		RefreshToken: refreshToken,
	}, nil
}
