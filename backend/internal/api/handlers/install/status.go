package install

import (
	"os"

	"github.com/gin-gonic/gin"
	pkgconfig "inkblog-backend/pkg/config"
	"inkblog-backend/pkg/utils"
)

// CheckStatus 检查安装状态
func CheckStatus(c *gin.Context) {
	lockFile := "install.lock"
	if _, err := os.Stat(lockFile); err == nil {
		utils.Success(c, gin.H{
			"installed": true,
		})
		return
	} else if !os.IsNotExist(err) {
		utils.InternalServerError(c, "读取安装状态失败")
		return
	}

	utils.Success(c, gin.H{
		"installed": false,
	})
}

// GetDefaultConfig 获取默认配置（从 config.yaml）
func GetDefaultConfig(c *gin.Context) {
	defaultConfig := gin.H{
		"db_type": "mysql",
		"db_host": "localhost",
		"db_port": "3306",
		"db_user": "root",
		"db_pass": "",
		"db_name": "inkblog",
	}

	// 如果 config.yaml 已加载，使用其中的配置
	if pkgconfig.AppConfig != nil {
		if pkgconfig.AppConfig.Database.Host != "" {
			defaultConfig["db_host"] = pkgconfig.AppConfig.Database.Host
		}
		if pkgconfig.AppConfig.Database.Port != "" {
			defaultConfig["db_port"] = pkgconfig.AppConfig.Database.Port
		}
		if pkgconfig.AppConfig.Database.User != "" {
			defaultConfig["db_user"] = pkgconfig.AppConfig.Database.User
		}
		if pkgconfig.AppConfig.Database.DBName != "" {
			defaultConfig["db_name"] = pkgconfig.AppConfig.Database.DBName
		}
	}

	utils.Success(c, defaultConfig)
}
