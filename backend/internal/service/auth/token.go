package auth

import (
	"errors"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

func RefreshToken(refreshToken string) (*AuthResponse, error) {
	claims, err := utils.ParseToken(refreshToken)
	if err != nil {
		return nil, errors.New("刷新令牌无效或已过期")
	}

	db := database.GetDB()

	var user model.User
	if err := db.First(&user, claims.UserID).Error; err != nil {
		return nil, errors.New("用户不存在")
	}

	if user.Status == "banned" {
		return nil, errors.New("您的账号已被封禁")
	}

	newToken, err := utils.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, errors.New("token 生成失败")
	}

	newRefreshToken, err := utils.GenerateRefreshToken(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, errors.New("refresh token 生成失败")
	}

	return &AuthResponse{
		User:         user.ToResponse(),
		Token:        newToken,
		RefreshToken: newRefreshToken,
	}, nil
}
