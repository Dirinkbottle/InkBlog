package middleware

import (
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"inkblog-backend/pkg/config"
	"time"
)

// CORS 跨域中间件
func CORS() gin.HandlerFunc {
	// 安装模式下允许任意来源访问安装接口。
	// main.go 会提前从 config.yaml 加载端口，这会让 AppConfig 非 nil，
	// 但此时 install.lock 仍不存在，不能按正式站点的 CORS 白名单处理。
	var allowedOrigins []string
	var allowCredentials bool

	if _, err := os.Stat("install.lock"); os.IsNotExist(err) {
		allowedOrigins = []string{"*"}
		allowCredentials = false
	} else if config.AppConfig != nil {
		allowedOrigins = config.AppConfig.CORS.AllowedOrigins
		allowCredentials = config.AppConfig.CORS.AllowCredentials
	} else {
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

