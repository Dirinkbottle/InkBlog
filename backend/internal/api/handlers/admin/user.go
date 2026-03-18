package admin

import (
	"strconv"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/utils"
)

// GetUsers 获取用户列表
func GetUsers(c *gin.Context) {
	db := database.GetDB()

	var users []model.User
	if err := db.Find(&users).Error; err != nil {
		utils.InternalServerError(c, "获取用户列表失败")
		return
	}

	var userResponses []model.UserResponse
	for _, user := range users {
		userResponses = append(userResponses, user.ToResponse())
	}

	utils.Success(c, gin.H{
		"users": userResponses,
		"total": len(userResponses),
	})
}

// GetUser 获取单个用户详情
func GetUser(c *gin.Context) {
	db := database.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的用户ID")
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	utils.Success(c, user.ToResponse())
}

// UpdateUser 更新用户信息
func UpdateUser(c *gin.Context) {
	db := database.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的用户ID")
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	var req struct {
		Role        string                 `json:"role"`
		Status      string                 `json:"status"`
		Permissions *model.UserPermissions `json:"permissions"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		notification.QueueWarning(c, "用户参数错误")
		utils.BadRequest(c, "请求参数错误: "+err.Error())
		return
	}

	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.NotFound(c, "用户不存在")
		return
	}

	if req.Role != "" {
		user.Role = req.Role
	}
	if req.Status != "" {
		user.Status = req.Status
	}
	if req.Permissions != nil {
		user.Permissions = *req.Permissions
	}

	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "更新用户失败")
		return
	}

	utils.Info("User updated by admin: %s", user.Username)
	notification.QueueSuccess(c, "用户更新成功")
	utils.Success(c, user.ToResponse())
}

// DeleteUser 删除用户
func DeleteUser(c *gin.Context) {
	db := database.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的用户ID")
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	currentUserID, _ := c.Get("user_id")
	if currentUserID.(uint) == uint(id) {
		notification.QueueWarning(c, "不能删除自己")
		utils.BadRequest(c, "不能删除自己")
		return
	}

	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.NotFound(c, "用户不存在")
		return
	}

	if err := db.Delete(&user).Error; err != nil {
		utils.InternalServerError(c, "删除用户失败")
		return
	}

	utils.Info("User deleted by admin: %s", user.Username)
	notification.QueueSuccess(c, "用户已删除")
	utils.Success(c, gin.H{"message": "用户已删除"})
}

// BanUser 封禁用户
func BanUser(c *gin.Context) {
	db := database.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的用户ID")
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	currentUserID, _ := c.Get("user_id")
	if currentUserID.(uint) == uint(id) {
		notification.QueueWarning(c, "不能封禁自己")
		utils.BadRequest(c, "不能封禁自己")
		return
	}

	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.NotFound(c, "用户不存在")
		return
	}

	user.Status = "banned"
	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "封禁用户失败")
		return
	}

	utils.Info("User banned by admin: %s", user.Username)
	notification.QueueSuccess(c, "用户已封禁")
	utils.Success(c, gin.H{"message": "用户已封禁"})
}

// UnbanUser 解封用户
func UnbanUser(c *gin.Context) {
	db := database.GetDB()
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		notification.QueueWarning(c, "无效的用户ID")
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	var user model.User
	if err := db.First(&user, id).Error; err != nil {
		notification.QueueWarning(c, "用户不存在")
		utils.NotFound(c, "用户不存在")
		return
	}

	user.Status = "active"
	if err := db.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "解封用户失败")
		return
	}

	utils.Info("User unbanned by admin: %s", user.Username)
	notification.QueueSuccess(c, "用户已解封")
	utils.Success(c, gin.H{"message": "用户已解封"})
}
