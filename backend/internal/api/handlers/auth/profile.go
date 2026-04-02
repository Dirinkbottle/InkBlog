package auth

import (
	"strings"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/utils"
)

// GetProfile 获取当前用户信息（包含头像）
func GetProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	db := database.GetDB()
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	// 用户查看自己的资料时返回头像
	utils.Success(c, user.ToResponseWithAvatar())
}

// UpdateProfile 更新用户资料
func UpdateProfile(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		DisplayName  string `json:"display_name"`
		Bio          string `json:"bio"`
		AvatarBase64 string `json:"avatar_base64"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "资料更新参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	db := database.GetDB()
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.NotFound(c, "用户不存在")
		return
	}

	// 更新字段
	user.DisplayName = req.DisplayName
	user.Bio = req.Bio
	user.AvatarBase64 = req.AvatarBase64

	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "更新失败")
		return
	}

	utils.Info("User profile updated: %s", user.Username)
	notification.QueueSuccess(c, "个人信息更新成功")
	utils.Success(c, user.ToResponseWithAvatar())
}

// ChangePassword 修改密码
func ChangePassword(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req struct {
		OldPassword string `json:"old_password" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "修改密码参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}
	req.OldPassword = strings.TrimSpace(req.OldPassword)
	req.NewPassword = strings.TrimSpace(req.NewPassword)
	if req.OldPassword == "" || req.NewPassword == "" {
		notification.QueueWarning(c, "密码不能为空")
		utils.BadRequest(c, "密码不能为空")
		return
	}
	if req.OldPassword == req.NewPassword {
		notification.QueueWarning(c, "新密码不能与旧密码一致")
		utils.BadRequest(c, "新密码不能与旧密码一致")
		return
	}

	db := database.GetDB()
	var user model.User
	if err := db.First(&user, userID).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.NotFound(c, "用户不存在")
		return
	}

	// 验证旧密码
	if !utils.CheckPassword(user.Password, req.OldPassword) {
		notification.QueueWarning(c, "旧密码错误")
		utils.BadRequest(c, "旧密码错误")
		return
	}

	// 加密新密码
	hashedPassword, err := utils.HashPassword(req.NewPassword)
	if err != nil {
		utils.InternalServerError(c, "密码加密失败")
		return
	}

	// 更新密码
	user.Password = hashedPassword
	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "密码修改失败")
		return
	}

	utils.Info("User password changed: %s", user.Username)
	notification.QueueSuccess(c, "密码修改成功")
	utils.Success(c, gin.H{"message": "密码修改成功"})
}
