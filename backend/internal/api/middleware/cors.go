package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"inkblog-backend/pkg/config"
	"time"
)

// CORS 跨域中间件
func CORS() gin.HandlerFunc {
	// 如果配置未加载（安装模式），使用默认的 CORS 配置
	var allowedOrigins []string
	var allowCredentials bool
	
	if config.AppConfig != nil {
		allowedOrigins = config.AppConfig.CORS.AllowedOrigins
		allowCredentials = config.AppConfig.CORS.AllowCredentials
	} else {
		// 默认允许所有源（仅用于安装模式）
		allowedOrigins = []string{"*"}
		allowCredentials = false
	}
	
	return cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: allowCredentials,
		MaxAge:           12 * time.Hour,
	})
}

