package model

import (
	"time"

	"gorm.io/gorm"
)

// Attachment 附件模型
type Attachment struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	PostID    *uint          `gorm:"index" json:"post_id"` // 可为空，允许上传时文章未保存
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	FileName  string         `gorm:"type:varchar(255);not null" json:"file_name"`
	FileURL   string         `gorm:"type:varchar(500);not null" json:"file_url"`
	FileSize  int64          `gorm:"not null" json:"file_size"`
	FileType  string         `gorm:"type:varchar(100);not null" json:"file_type"`
	
	// 关联
	User *User `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Post *Post `gorm:"foreignKey:PostID" json:"post,omitempty"`
}

