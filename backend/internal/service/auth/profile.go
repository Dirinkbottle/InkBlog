package auth

import (
	"errors"

	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

func GetProfile(userID uint) (*model.UserResponse, error) {
	db := database.GetDB()

	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, errors.New("数据库查询失败")
	}

	response := user.ToResponse()
	return &response, nil
}
