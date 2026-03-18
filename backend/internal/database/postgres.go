package database

import (
	"fmt"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"inkblog-backend/pkg/utils"
)

var DB *gorm.DB

// InitPostgreSQL 初始化 PostgreSQL 数据库连接
func InitPostgreSQL(host, port, user, password, dbname string) (*gorm.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		host, port, user, password, dbname)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		DisableForeignKeyConstraintWhenMigrating: false,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to PostgreSQL: %w", err)
	}

	utils.Info("PostgreSQL database connected successfully")
	return db, nil
}

// InitDB 初始化数据库连接（从配置文件）
func InitDB(dbType, host, port, user, password, dbname string) error {
	var err error

	utils.Info("Initializing database: type=%s host=%s port=%s dbname=%s", dbType, host, port, dbname)

	if dbType == "mysql" {
		DB, err = InitMySQL(host, port, user, password, dbname)
	} else if dbType == "postgres" {
		DB, err = InitPostgreSQL(host, port, user, password, dbname)
	} else {
		return fmt.Errorf("unsupported database type: %s", dbType)
	}

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	utils.Info("Database connected successfully")

	return nil
}

// RunInitSQL 执行 initial.sql 初始化脚本
func RunInitSQL(db *gorm.DB) error {
	utils.Info("Running initial.sql...")
	if err := ExecSQLFile(db, "scripts/initial.sql"); err != nil {
		return fmt.Errorf("failed to run initial.sql: %w", err)
	}
	utils.Info("Database initialization completed successfully")
	return nil
}

// GetDB 获取数据库连接
func GetDB() *gorm.DB {
	return DB
}

// SetDB 设置全局数据库连接（用于安装流程）
func SetDB(db *gorm.DB) {
	DB = db
	utils.Info("Global database connection has been set")
}

