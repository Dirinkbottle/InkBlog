package service

import (
	"encoding/json"
	"fmt"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

// GetAllSettings 查询 id=1 的行，解析 JSON 返回 map
func GetAllSettings() (map[string]string, error) {
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

// GetSetting 便捷读取单个 key，出错或不存在时返回 defaultValue
func GetSetting(key, defaultValue string) string {
	all, err := GetAllSettings()
	if err != nil {
		return defaultValue
	}
	if v, ok := all[key]; ok && v != "" {
		return v
	}
	return defaultValue
}

// UpdateSettings 将 updates merge 到现有 JSON 并写回
func UpdateSettings(updates map[string]string) error {
	db := database.GetDB()
	var setting model.Setting
	if err := db.First(&setting, 1).Error; err != nil {
		return fmt.Errorf("读取设置失败: %w", err)
	}

	current := make(map[string]string)
	if err := json.Unmarshal([]byte(setting.Value), &current); err != nil {
		return fmt.Errorf("解析设置 JSON 失败: %w", err)
	}

	for k, v := range updates {
		current[k] = v
	}

	data, err := json.Marshal(current)
	if err != nil {
		return fmt.Errorf("序列化设置 JSON 失败: %w", err)
	}

	return db.Model(&setting).Update("value", string(data)).Error
}
