package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"inkblog-backend/internal/api"
	"inkblog-backend/internal/bootstrap"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/service"
	pkgconfig "inkblog-backend/pkg/config"
	"inkblog-backend/pkg/utils"
)

// getStringSliceOrDefault 返回字符串切片，如果为空则返回默认值
func getStringSliceOrDefault(value []string, defaultValue []string) []string {
	if len(value) == 0 {
		return defaultValue
	}
	return value
}

func main() {
	// 初始化日志系统
	if err := utils.InitLogger("./logs/app.log"); err != nil {
		log.Printf("Warning: Failed to initialize logger: %v", err)
	}
	defer utils.CloseLogger()

	utils.Info("========================================")
	utils.Info("    InkBlog Backend Starting...")
	utils.Info("========================================")

	// 检查是否已安装（通过 install.lock 文件）
	if _, err := os.Stat("install.lock"); os.IsNotExist(err) {
		utils.Warn("System not installed yet!")

		// 尝试从 config.yaml 读取端口配置（如果存在）
		port := "8080" // 默认端口
		if _, err := os.Stat("config.yaml"); err == nil {
			// 配置文件存在，尝试加载以获取端口
			if err := pkgconfig.LoadConfig(); err == nil {
				if pkgconfig.AppConfig != nil && pkgconfig.AppConfig.Server.Port != "" {
					port = pkgconfig.AppConfig.Server.Port
				}
			}
		}

		utils.Warn("Please visit http://your-server:%s/install to complete installation", port)
		utils.Info("Starting server in install mode...")

		// 启动服务器但不连接数据库（安装模式）
		router := api.SetupRouter()
		utils.Info("Server listening on :%s (Install Mode)", port)

		srv := &http.Server{
			Addr:    ":" + port,
			Handler: router,
		}

		// 启动服务器（非阻塞）
		go func() {
			if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
				utils.Error("Failed to start server: %v", err)
				log.Fatal(err)
			}
		}()

		// 等待中断信号
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
		<-quit

		utils.Info("Shutting down server...")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := srv.Shutdown(ctx); err != nil {
			utils.Error("Server forced to shutdown: %v", err)
		}

		utils.Info("Server exited")
		return
	}

	utils.Info("Installation detected, loading configuration...")

	appConfig, err := bootstrap.LoadInstalledAppConfig("config.json")
	if err != nil {
		utils.Error("Failed to load app config: %v", err)
		log.Fatal("Please run installation first or check config.json file")
	}

	if err := bootstrap.ApplyRuntimeConfig(appConfig); err != nil {
		utils.Error("Failed to apply runtime config: %v", err)
		log.Fatal(err)
	}

	utils.Info("Configuration loaded successfully")
	utils.Info("Database: %s (%s:%s)", appConfig.Database.Type, appConfig.Database.Host, appConfig.Database.Port)

	// 初始化数据库
	if err := bootstrap.InitDatabaseFromAppConfig(appConfig); err != nil {
		utils.Error("Failed to initialize database: %v", err)
		log.Fatal(err)
	}

	utils.Info("Database initialized successfully")

	// 启动定时清理任务
	service.StartCleanupScheduler()
	utils.Info("Cleanup scheduler started")

	// 设置路由
	router := api.SetupRouter()

	// 启动服务器
	port := appConfig.Server.Port
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	utils.Info("========================================")
	utils.Info("Server is running on %s", addr)
	utils.Info("Press Ctrl+C to stop")
	utils.Info("========================================")

	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	// 启动服务器（非阻塞）
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			utils.Error("Failed to start server: %v", err)
			log.Fatal(err)
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	utils.Info("")
	utils.Info("========================================")
	utils.Info("Shutting down server gracefully...")
	utils.Info("========================================")

	// 停止定时任务
	service.StopCleanupScheduler()
	utils.Info("Cleanup scheduler stopped")

	// 关闭数据库连接
	if db := database.GetDB(); db != nil {
		sqlDB, err := db.DB()
		if err == nil {
			sqlDB.Close()
			utils.Info("Database connection closed")
		}
	}

	// 优雅关闭 HTTP 服务器（等待最多 5 秒）
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		utils.Error("Server forced to shutdown: %v", err)
	} else {
		utils.Info("Server shutdown completed")
	}

	utils.Info("========================================")
	utils.Info("Server exited successfully")
	utils.Info("========================================")
}
