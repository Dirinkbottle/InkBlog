package install

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	pkgconfig "inkblog-backend/pkg/config"
	"inkblog-backend/pkg/utils"
)

// Perform 执行安装
func Perform(c *gin.Context) {
	var req model.InstallConfig

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	utils.Info("Starting installation process...")

	var db *gorm.DB
	var err error

	if req.DBType == "mysql" {
		db, err = database.InitMySQL(req.DBHost, req.DBPort, req.DBUser, req.DBPass, req.DBName)
	} else if req.DBType == "postgres" {
		db, err = database.InitPostgreSQL(req.DBHost, req.DBPort, req.DBUser, req.DBPass, req.DBName)
	} else {
		utils.BadRequest(c, "不支持的数据库类型")
		return
	}

	if err != nil {
		utils.Error("Database connection failed during install: %v", err)
		utils.BadRequest(c, "数据库连接失败: "+err.Error())
		return
	}

	utils.Info("Running initial.sql to create tables and seed data...")
	database.SetDB(db)
	if err := database.RunInitSQL(db); err != nil {
		utils.Error("Database initialization failed: %v", err)
		utils.BadRequest(c, "数据库初始化失败: "+err.Error())
		return
	}
	utils.Info("Database initialized successfully")

	if err := createAdminUser(db, req); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	secret := generateRandomSecret(32)

	if err := saveConfig(req, secret); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	if err := createLockFile(); err != nil {
		utils.BadRequest(c, err.Error())
		return
	}

	uploadDir := filepath.Join(".", "uploads")
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		utils.Warn("Failed to create uploads directory: %v", err)
	}

	utils.Info("Installation completed successfully!")

	utils.SuccessWithMessage(c, "安装成功！请重启服务器以应用新配置。", gin.H{
		"admin_user":  req.AdminUser,
		"admin_email": req.AdminEmail,
	})
}

func createAdminUser(db *gorm.DB, req model.InstallConfig) error {
	utils.Info("Creating admin user: %s", req.AdminUser)
	hashedPassword, err := utils.HashPassword(req.AdminPass)
	if err != nil {
		utils.Error("Password hashing failed: %v", err)
		return fmt.Errorf("密码加密失败: %v", err)
	}

	admin := model.User{
		Username: req.AdminUser,
		Email:    req.AdminEmail,
		Password: hashedPassword,
		Role:     "admin",
		Status:   "active",
		Permissions: model.UserPermissions{
			CanCreatePost:             true,
			CanEditPost:               true,
			CanDeletePost:             true,
			CanComment:                true,
			CanViewPrivate:            true,
			CanCommentWithoutApproval: true,
		},
		IsEmailVerified: true,
	}

	if err := db.Create(&admin).Error; err != nil {
		utils.Error("Admin user creation failed: %v", err)
		return fmt.Errorf("管理员账户创建失败: %v", err)
	}

	utils.Info("Admin user created successfully with ID: %d", admin.ID)
	return nil
}

func saveConfig(req model.InstallConfig, secret string) error {
	// 从 config.yaml 读取服务器端口配置
	serverPort := "8080" // 默认端口
	if pkgconfig.AppConfig != nil && pkgconfig.AppConfig.Server.Port != "" {
		serverPort = pkgconfig.AppConfig.Server.Port
	}
	
	configData := model.AppConfig{}
	configData.Server.Port = serverPort
	configData.Server.Mode = "release"
	configData.Database.Type = req.DBType
	configData.Database.Host = req.DBHost
	configData.Database.Port = req.DBPort
	configData.Database.User = req.DBUser
	configData.Database.Password = req.DBPass
	configData.Database.DBName = req.DBName
	configData.JWT.Secret = secret
	configData.JWT.Expiration = "24h"
	configData.JWT.RefreshExpiration = "168h"
	configData.Upload.Path = "./uploads"
	configData.Upload.MaxSize = 10485760
	configData.CORS.AllowedOrigins = []string{"*"}
	configData.CORS.AllowCredentials = false

	runtimeConfig := &pkgconfig.Config{
		Server: pkgconfig.ServerConfig{
			Port: configData.Server.Port,
			Mode: configData.Server.Mode,
		},
		Database: pkgconfig.DatabaseConfig{
			Host:     configData.Database.Host,
			Port:     configData.Database.Port,
			User:     configData.Database.User,
			Password: configData.Database.Password,
			DBName:   configData.Database.DBName,
		},
		JWT: pkgconfig.JWTConfig{
			Secret:            configData.JWT.Secret,
			Expiration:        24 * time.Hour,
			RefreshExpiration: 168 * time.Hour,
		},
		Upload: pkgconfig.UploadConfig{
			Path:    configData.Upload.Path,
			MaxSize: configData.Upload.MaxSize,
		},
		CORS: pkgconfig.CORSConfig{
			AllowedOrigins:   []string{"*"},
			AllowCredentials: false,
		},
	}
	pkgconfig.LoadConfigFromAppConfig(runtimeConfig)
	utils.Info("Global configuration initialized")

	configFile := "config.json"
	configJSON, err := json.MarshalIndent(configData, "", "  ")
	if err != nil {
		utils.Error("Config JSON marshal failed: %v", err)
		return fmt.Errorf("配置序列化失败: %v", err)
	}

	if err := os.WriteFile(configFile, configJSON, 0644); err != nil {
		utils.Error("Config file write failed: %v", err)
		return fmt.Errorf("配置文件保存失败: %v", err)
	}

	utils.Info("Configuration file saved: %s", configFile)
	return nil
}

func createLockFile() error {
	lockFile := "install.lock"
	lockContent := fmt.Sprintf("Installed at: %s\n", utils.FormatTime(nil))
	if err := os.WriteFile(lockFile, []byte(lockContent), 0644); err != nil {
		utils.Error("Lock file creation failed: %v", err)
		return fmt.Errorf("锁文件创建失败: %v", err)
	}

	utils.Info("Installation lock file created")
	return nil
}

func generateRandomSecret(length int) string {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "default-secret-please-change"
	}
	return hex.EncodeToString(bytes)
}
