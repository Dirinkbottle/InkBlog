package database

import (
	"fmt"
	"os"
	"strings"

	"gorm.io/gorm"
	"inkblog-backend/pkg/utils"
)

// ExecSQLFile 读取并执行 SQL 文件（按分号分割语句逐条执行）
func ExecSQLFile(db *gorm.DB, filePath string) error {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("读取 SQL 文件失败: %w", err)
	}

	statements := splitStatements(string(content))

	for i, stmt := range statements {
		if stmt == "" {
			continue
		}
		if err := db.Exec(stmt).Error; err != nil {
			utils.Warn("SQL 语句 #%d 执行失败 (跳过): %v", i+1, err)
		}
	}

	utils.Info("SQL 文件执行完成: %s (%d 条语句)", filePath, len(statements))
	return nil
}

// splitStatements 按分号分割 SQL，忽略注释和空行
func splitStatements(sql string) []string {
	var result []string
	for _, raw := range strings.Split(sql, ";") {
		// 逐行去掉注释
		var lines []string
		for _, line := range strings.Split(raw, "\n") {
			trimmed := strings.TrimSpace(line)
			if trimmed == "" || strings.HasPrefix(trimmed, "--") {
				continue
			}
			lines = append(lines, line)
		}
		stmt := strings.TrimSpace(strings.Join(lines, "\n"))
		if stmt != "" {
			result = append(result, stmt)
		}
	}
	return result
}
