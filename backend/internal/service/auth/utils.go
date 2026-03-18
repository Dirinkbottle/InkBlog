package auth

import (
	"encoding/json"
	"fmt"
	"strconv"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	"inkblog-backend/pkg/utils"
)

func getAllSettings() (map[string]string, error) {
	db := database.GetDB()
	var setting model.Setting
	if err := db.First(&setting, 1).Error; err != nil {
		return nil, fmt.Errorf("读取设置失败: %w", err)
	}

	result := make(map[string]string)
	if err := json.Unmarshal([]byte(setting.Value), &result); err != nil {
		return nil, fmt.Errorf("解析设置 JSON 失败: %w", err)
	}
	return result, nil
}

func getSetting(key, defaultValue string) string {
	all, err := getAllSettings()
	if err != nil {
		return defaultValue
	}
	if v, ok := all[key]; ok && v != "" {
		return v
	}
	return defaultValue
}

func getEmailConfig() (*utils.EmailConfig, error) {
	allSettings, err := getAllSettings()
	if err != nil {
		return nil, err
	}

	config := &utils.EmailConfig{}
	config.SMTPHost = allSettings["email_smtp_host"]
	port, _ := strconv.Atoi(allSettings["email_smtp_port"])
	config.SMTPPort = port
	config.Username = allSettings["email_smtp_username"]
	config.Password = allSettings["email_smtp_password"]
	config.FromAddress = allSettings["email_from_address"]
	config.FromName = allSettings["email_from_name"]
	config.Library = allSettings["email_library"]

	if config.Library == "" {
		config.Library = "gomail"
	}

	return config, nil
}
