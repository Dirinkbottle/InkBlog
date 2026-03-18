package api

import (
	"github.com/gin-gonic/gin"
	"inkblog-backend/internal/api/handlers"
	"inkblog-backend/internal/api/handlers/admin"
	"inkblog-backend/internal/api/handlers/auth"
	"inkblog-backend/internal/api/handlers/category"
	"inkblog-backend/internal/api/handlers/comment"
	"inkblog-backend/internal/api/handlers/install"
	"inkblog-backend/internal/api/middleware"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/config"
)

// SetupRouter 设置路由
func SetupRouter() *gin.Engine {
	// 设置 Gin 模式
	// 如果配置未加载（安装模式），使用默认的 debug 模式
	if config.AppConfig != nil {
		gin.SetMode(config.AppConfig.Server.Mode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	r := gin.New()

	// 使用中间件
	r.Use(middleware.RequestID())
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())
	r.Use(notification.ToastDispatchMiddleware())

	// 静态文件服务（上传的图片）
	// 仅在配置已加载时设置
	if config.AppConfig != nil {
		r.Static("/uploads", config.AppConfig.Upload.Path)
	}

	// 安装接口（未安装时可访问）
	installGroup := r.Group("/api/v1/install")
	{
		installGroup.GET("/status", install.CheckStatus)
		installGroup.GET("/default-config", install.GetDefaultConfig)
		installGroup.GET("/tables", install.GetTableInfo)
		installGroup.POST("/test-db", install.TestDBConnection)
		installGroup.POST("/perform", install.Perform)
	}

	// API 路由组
	api := r.Group("/api/v1")
	{
		// 认证相关路由（公开）
		authGroup := api.Group("/auth")
		{
			authGroup.POST("/register", auth.Register)
			authGroup.POST("/login", auth.Login)
			authGroup.POST("/refresh", auth.RefreshToken)
			authGroup.POST("/logout", middleware.AuthMiddleware(), auth.Logout)
			authGroup.GET("/profile", middleware.AuthMiddleware(), auth.GetProfile)
			authGroup.PUT("/profile", middleware.AuthMiddleware(), auth.UpdateProfile)
			authGroup.PUT("/change-password", middleware.AuthMiddleware(), auth.ChangePassword)
		}

		// 文章相关路由（公开）
		posts := api.Group("/posts")
		{
			posts.GET("", handlers.GetPostList)
			posts.GET("/:id", handlers.GetPostByID)
			posts.GET("/slug/:slug", handlers.GetPostBySlug)
		}

		// 分类和标签路由（公开）
		api.GET("/categories", category.GetCategories)
		api.GET("/tags", category.GetTags)

		// 网站设置路由（公开）
		api.GET("/settings", handlers.GetSettings)

		// 统计信息路由（公开）
		api.GET("/statistics", handlers.GetStatistics)

		// 邮箱验证路由（公开）
		api.GET("/verify-email", auth.VerifyEmail)
		api.POST("/resend-verification", auth.ResendVerificationEmail)

		// 评论路由（公开）
		comments := api.Group("/comments")
		{
			comments.GET("/post/:postId", comment.GetPostComments)                // 获取文章的评论列表
			comments.POST("", middleware.AuthMiddleware(), comment.CreateComment) // 创建评论（需要登录）
		}

		// 公开的用户主页路由
		api.GET("/users/:id", handlers.GetPublicUserProfile)     // 获取用户公开资料
		api.GET("/users/:id/posts", handlers.GetPublicUserPosts) // 获取用户的文章列表

		// 用户内容管理路由（需要登录 + 对应权限）
		user := api.Group("/user")
		user.Use(middleware.AuthMiddleware())
		{
			// 文章管理（只能管理自己的文章）
			user.GET("/posts", handlers.UserGetPosts)
			user.GET("/posts/:id", handlers.UserGetPost)
			user.POST("/posts", middleware.RequirePermission("create_post"), admin.CreatePost)
			user.PUT("/posts/:id", middleware.RequirePermission("edit_post"), admin.UpdatePost)
			user.DELETE("/posts/:id", middleware.RequirePermission("delete_post"), admin.DeletePost)
			user.PATCH("/posts/:id/publish", middleware.RequirePermission("edit_post"), admin.PublishPost)

			// 图片上传
			user.POST("/upload", admin.UploadImage)
			user.POST("/upload/editor", admin.UploadImageFromEditor)

			// 附件管理
			user.GET("/posts/:id/attachments", handlers.UserGetPostAttachments)
			user.DELETE("/attachments/:id", handlers.UserDeleteAttachment)
		}

		// 管理员路由（只允许 admin 角色）
		adminGroup := api.Group("/admin")
		adminGroup.Use(middleware.AuthMiddleware())
		adminGroup.Use(middleware.RequireRole("admin"))
		{
			// 文章管理（可以管理所有人的文章）
			adminGroup.GET("/posts", admin.GetPostList)
			adminGroup.POST("/posts", admin.CreatePost)
			adminGroup.PUT("/posts/:id", admin.UpdatePost)
			adminGroup.DELETE("/posts/:id", admin.DeletePost)
			adminGroup.PATCH("/posts/:id/publish", admin.PublishPost)

			// 图片上传
			adminGroup.POST("/upload", admin.UploadImage)
			adminGroup.POST("/upload/editor", admin.UploadImageFromEditor)

			// 附件管理
			adminGroup.GET("/posts/:id/attachments", admin.GetPostAttachments)
			adminGroup.DELETE("/attachments/:id", admin.DeleteAttachment)

			// 分类管理（仅管理员）
			categories := adminGroup.Group("/categories")
			{
				categories.GET("", category.AdminGetCategories)
				categories.POST("", category.AdminCreateCategory)
				categories.PUT("/:id", category.AdminUpdateCategory)
				categories.DELETE("/:id", category.AdminDeleteCategory)
			}

			// 标签管理（仅管理员）
			tags := adminGroup.Group("/tags")
			{
				tags.GET("", handlers.AdminGetTags)
				tags.POST("", handlers.AdminCreateTag)
				tags.PUT("/:id", handlers.AdminUpdateTag)
				tags.DELETE("/:id", handlers.AdminDeleteTag)
			}

			// 用户管理（仅管理员）
			users := adminGroup.Group("/users")
			{
				users.GET("", admin.GetUsers)
				users.GET("/:id", admin.GetUser)
				users.PUT("/:id", admin.UpdateUser)
				users.DELETE("/:id", admin.DeleteUser)
				users.POST("/:id/ban", admin.BanUser)
				users.POST("/:id/unban", admin.UnbanUser)
			}

			// 评论管理（管理员和编辑）
			adminComments := adminGroup.Group("/comments")
			{
				adminComments.GET("", comment.AdminGetComments)
				adminComments.GET("/:id", comment.AdminGetComment)
				adminComments.POST("/:id/approve", comment.AdminApproveComment)
				adminComments.POST("/:id/reject", comment.AdminRejectComment)
				adminComments.DELETE("/:id", comment.AdminDeleteComment)
			}

			// 网站设置管理（仅管理员）
			settings := adminGroup.Group("/settings")
			{
				settings.GET("", handlers.AdminGetSettings)
				settings.PUT("", handlers.AdminUpdateSettings)
			}
		}
	}

	// 健康检查
	r.GET("/health", func(c *gin.Context) {
		status := gin.H{"status": "ok"}

		// 检查数据库连接
		if database.GetDB() == nil {
			status["database"] = "not connected"
			status["status"] = "degraded"
		} else {
			sqlDB, err := database.GetDB().DB()
			if err != nil || sqlDB.Ping() != nil {
				status["database"] = "connection error"
				status["status"] = "degraded"
			} else {
				status["database"] = "connected"
			}
		}

		// 检查配置加载状态
		if config.AppConfig == nil {
			status["config"] = "not loaded"
			status["status"] = "degraded"
		} else {
			status["config"] = "loaded"
		}

		c.JSON(200, status)
	})

	return r
}
