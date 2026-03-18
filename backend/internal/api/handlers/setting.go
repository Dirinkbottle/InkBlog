package handlers

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/service"
	"inkblog-backend/pkg/utils"
)

// GetSettings 获取所有设置（公开）
func GetSettings(c *gin.Context) {
	settings, err := service.GetAllSettings()
	if err != nil {
		utils.InternalServerError(c, "获取设置失败")
		return
	}
	utils.Success(c, settings)
}

// AdminGetSettings 管理员获取所有设置
func AdminGetSettings(c *gin.Context) {
	settings, err := service.GetAllSettings()
	if err != nil {
		utils.InternalServerError(c, "获取设置失败")
		return
	}
	utils.Success(c, settings)
}

// AdminUpdateSettings 管理员批量更新设置
func AdminUpdateSettings(c *gin.Context) {
	var updates map[string]string
	if err := c.ShouldBindJSON(&updates); err != nil {
		utils.BadRequest(c, "参数错误："+err.Error())
		return
	}

	if err := service.UpdateSettings(updates); err != nil {
		utils.InternalServerError(c, "更新设置失败")
		return
	}

	utils.Success(c, gin.H{"message": "设置更新成功"})
}
