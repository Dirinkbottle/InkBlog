package model

import (
	"time"
)

type Setting struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	Value     string    `gorm:"type:text" json:"value"` // JSON 字符串
}

// TableName 指定表名
func (Setting) TableName() string {
	return "settings"
}
