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
	utils.Success(c, publicSettings(settings))
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

// Public settings are an explicit allowlist. SMTP and service credentials belong
// exclusively to the authenticated administrator endpoint.
func publicSettings(settings map[string]string) map[string]string {
	public := make(map[string]string)
	for _, key := range []string{
		"site_name", "site_subtitle", "site_description", "site_keywords", "site_purpose", "site_url",
		"hero_title", "hero_description", "footer_text", "icp_number",
		"seo_title", "seo_description", "seo_keywords",
		"social_github", "social_twitter", "social_email", "social_wechat",
		"comment_auto_approve", "comment_require_moderation",
		"email_verification_enabled", "email_verification_expiry_hours",
	} {
		if value, ok := settings[key]; ok {
			public[key] = value
		}
	}
	return public
}
