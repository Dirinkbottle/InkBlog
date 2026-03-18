package middleware

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

// RequirePermission 检查用户是否有特定权限
// 使用上下文中已加载的权限数据，避免重复查询数据库
func RequirePermission(permNames ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户角色
		role, roleExists := c.Get("role")
		if !roleExists {
			utils.Unauthorized(c, "未认证")
			c.Abort()
			return
		}

		// 管理员拥有所有权限
		if role == "admin" {
			c.Next()
			return
		}

		// 获取权限对象（由 AuthMiddleware 加载）
		permsInterface, permsExists := c.Get("permissions")
		if !permsExists {
			utils.Unauthorized(c, "权限信息缺失")
			c.Abort()
			return
		}

		perms, ok := permsInterface.(*model.UserPermissions)
		if !ok {
			utils.InternalServerError(c, "权限信息格式错误")
			c.Abort()
			return
		}

		// 检查每个所需权限
		for _, permName := range permNames {
			if !HasPermission(perms, permName) {
				utils.Forbidden(c, "您没有权限执行此操作")
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// HasPermission 统一的权限检查函数
func HasPermission(perms *model.UserPermissions, permName string) bool {
	switch permName {
	case "create_post":
		return perms.CanCreatePost
	case "edit_post":
		return perms.CanEditPost
	case "delete_post":
		return perms.CanDeletePost
	case "comment":
		return perms.CanComment
	case "view_private":
		return perms.CanViewPrivate
	case "comment_without_approval":
		return perms.CanCommentWithoutApproval
	default:
		return false
	}
}
