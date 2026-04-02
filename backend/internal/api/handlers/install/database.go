package install

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/pkg/utils"
	"strings"
)

// TestDBConnection 测试数据库连接
func TestDBConnection(c *gin.Context) {
	var req struct {
		DBType string `json:"db_type" binding:"required"`
		DBHost string `json:"db_host" binding:"required"`
		DBPort string `json:"db_port" binding:"required"`
		DBUser string `json:"db_user" binding:"required"`
		DBPass string `json:"db_pass" binding:"required"`
		DBName string `json:"db_name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	utils.Info("Testing database connection: %s@%s:%s/%s", req.DBUser, req.DBHost, req.DBPort, req.DBName)

	var db *gorm.DB
	var err error

	dbType := strings.ToLower(strings.TrimSpace(req.DBType))

	if dbType == "mysql" {
		db, err = database.InitMySQL(req.DBHost, req.DBPort, req.DBUser, req.DBPass, req.DBName)
	} else if dbType == "postgres" {
		db, err = database.InitPostgreSQL(req.DBHost, req.DBPort, req.DBUser, req.DBPass, req.DBName)
	} else {
		utils.BadRequest(c, "不支持的数据库类型，仅支持 mysql 或 postgres")
		return
	}

	if err != nil {
		utils.Error("Database connection test failed: %v", err)
		utils.BadRequest(c, "数据库连接失败: "+err.Error())
		return
	}

	sqlDB, _ := db.DB()
	if sqlDB != nil {
		if closeErr := sqlDB.Close(); closeErr != nil {
			utils.Warn("Close temporary install DB connection failed: %v", closeErr)
		}
	}

	utils.Info("Database connection test successful")
	utils.Success(c, gin.H{
		"message": "数据库连接成功",
	})
}

// GetTableInfo 获取数据库表信息
func GetTableInfo(c *gin.Context) {
	tables := []gin.H{
		{
			"name":        "users",
			"description": "用户表",
			"purpose":     "存储用户账户信息，包括用户名、邮箱、密码（加密）、角色等",
			"fields": []string{
				"id - 主键",
				"username - 用户名（唯一）",
				"email - 邮箱（唯一）",
				"password - 密码哈希",
				"avatar - 头像URL",
				"role - 角色（user/admin）",
				"created_at - 创建时间",
			},
		},
		{
			"name":        "categories",
			"description": "分类表",
			"purpose":     "存储文章分类信息，支持层级分类",
			"fields": []string{
				"id - 主键",
				"name - 分类名称（唯一）",
				"slug - URL别名（唯一）",
				"description - 分类描述",
				"parent_id - 父分类ID（支持多级分类）",
				"sort_order - 排序",
			},
		},
		{
			"name":        "tags",
			"description": "标签表",
			"purpose":     "存储文章标签，一篇文章可以有多个标签",
			"fields": []string{
				"id - 主键",
				"name - 标签名称（唯一）",
				"slug - URL别名（唯一）",
			},
		},
		{
			"name":        "posts",
			"description": "文章表",
			"purpose":     "存储博客文章内容、标题、摘要、封面等信息",
			"fields": []string{
				"id - 主键",
				"title - 文章标题",
				"slug - URL别名（唯一）",
				"content - 文章内容（Markdown格式）",
				"summary - 文章摘要",
				"cover_image - 封面图URL",
				"author_id - 作者ID（外键关联users表）",
				"category_id - 分类ID（外键关联categories表）",
				"status - 状态（draft草稿/published已发布）",
				"views - 浏览量",
				"likes - 点赞数",
				"published_at - 发布时间",
			},
		},
		{
			"name":        "post_tags",
			"description": "文章标签关联表",
			"purpose":     "实现文章和标签的多对多关系",
			"fields": []string{
				"post_id - 文章ID",
				"tag_id - 标签ID",
			},
		},
		{
			"name":        "comments",
			"description": "评论表",
			"purpose":     "存储文章评论，支持嵌套回复",
			"fields": []string{
				"id - 主键",
				"post_id - 文章ID（外键）",
				"user_id - 用户ID（外键，可为空表示游客评论）",
				"parent_id - 父评论ID（支持嵌套回复）",
				"content - 评论内容",
				"status - 状态（pending待审核/approved已通过/rejected已拒绝）",
				"ip - IP地址",
				"user_agent - 浏览器信息",
			},
		},
	}

	utils.Success(c, gin.H{
		"tables": tables,
		"total":  len(tables),
	})
}
