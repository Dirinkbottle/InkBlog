package service

import (
	"strconv"
	"time"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

// CleanupUnverifiedUsers 清理过期未验证的用户
func CleanupUnverifiedUsers() {
	db := database.GetDB()

	// 获取过期时间配置
	expiryHours := 24
	if hours, err := strconv.Atoi(GetSetting("email_verification_expiry_hours", "24")); err == nil {
		expiryHours = hours
	}

	cutoffTime := time.Now().Add(-time.Duration(expiryHours) * time.Hour)

	var users []model.User
	if err := db.Where("is_email_verified = ? AND email_verification_sent_at < ? AND email_verification_sent_at != ?", false, cutoffTime, time.Time{}).Find(&users).Error; err != nil {
		utils.Error("Failed to query unverified users: %v", err)
		return
	}

	for _, user := range users {
		if err := db.Unscoped().Delete(&user).Error; err != nil {
			utils.Error("Failed to delete unverified user %s: %v", user.Email, err)
		} else {
			utils.Info("Deleted unverified user: %s (expired)", user.Email)
		}
	}

	if len(users) > 0 {
		utils.Info("Cleanup completed: %d unverified users deleted", len(users))
	}
}

var cleanupTicker *time.Ticker

// StartCleanupScheduler 启动定时清理任务
func StartCleanupScheduler() {
	cleanupTicker = time.NewTicker(1 * time.Hour) // 每小时执行一次
	go func() {
		for range cleanupTicker.C {
			CleanupUnverifiedUsers()
		}
	}()
}

// StopCleanupScheduler 停止定时清理任务
func StopCleanupScheduler() {
	if cleanupTicker != nil {
		cleanupTicker.Stop()
		utils.Info("Cleanup scheduler ticker stopped")
	}
}

