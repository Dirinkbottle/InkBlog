package middleware

import (
	"strings"

	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

// AuthMiddleware JWT 认证中间件
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取 Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "未提供认证令牌")
			c.Abort()
			return
		}

		// 检查 Bearer 前缀
		parts := strings.SplitN(authHeader, " ", 2)
		if !(len(parts) == 2 && parts[0] == "Bearer") {
			utils.Unauthorized(c, "认证令牌格式错误")
			c.Abort()
			return
		}

		// 解析 token
		claims, err := utils.ParseToken(parts[1])
		if err != nil {
			utils.Unauthorized(c, "认证令牌无效或已过期")
			c.Abort()
			return
		}

		// 从数据库加载用户完整信息（包括权限）
		db := database.GetDB()
		var user model.User
		if err := db.First(&user, claims.UserID).Error; err != nil {
			utils.Unauthorized(c, "用户不存在")
			c.Abort()
			return
		}

		// 检查用户状态
		if user.Status == "banned" {
			utils.Forbidden(c, "账号已被封禁")
			c.Abort()
			return
		}

		// 将用户完整信息存入上下文（一次性加载，避免后续重复查询）
		c.Set("user_id", user.ID)
		c.Set("username", user.Username)
		c.Set("role", user.Role)
		c.Set("user", &user) // 存储完整用户对象
		c.Set("permissions", &user.Permissions) // 存储权限对象

		c.Next()
	}
}

// AdminMiddleware 管理员权限中间件
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			utils.Unauthorized(c, "未认证")
			c.Abort()
			return
		}

		if role != "admin" {
			utils.Forbidden(c, "权限不足")
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole 检查用户角色中间件（支持多个角色）
func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			utils.Warn("[RequireRole] Role not found in context")
			utils.Unauthorized(c, "未认证")
			c.Abort()
			return
		}

		// 检查用户角色是否在允许的角色列表中
		roleStr := userRole.(string)
		utils.Info("[RequireRole] User role: %s, Required roles: %v", roleStr, roles)
		
		allowed := false
		for _, role := range roles {
			if roleStr == role {
				allowed = true
				break
			}
		}

		if !allowed {
			utils.Warn("[RequireRole] Access denied for role %s (required: %v)", roleStr, roles)
			utils.Forbidden(c, "权限不足")
			c.Abort()
			return
		}

		utils.Info("[RequireRole] Access granted for role %s", roleStr)
		c.Next()
	}
}

