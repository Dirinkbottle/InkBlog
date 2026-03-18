package middleware

import (
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger 日志中间件
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		startTime := time.Now()
		
		// 处理请求
		c.Next()
		
		// 记录请求信息
		endTime := time.Now()
		latency := endTime.Sub(startTime)
		
		clientIP := c.ClientIP()
		method := c.Request.Method
		statusCode := c.Writer.Status()
		path := c.Request.URL.Path
		requestID, _ := c.Get("request_id")
		
		log.Printf("[%s] %s %s %d %v %s request_id=%v",
			endTime.Format("2006-01-02 15:04:05"),
			clientIP,
			method,
			statusCode,
			latency,
			path,
			requestID,
		)
	}
}

