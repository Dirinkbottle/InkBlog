package model

import (
	"time"

	"gorm.io/gorm"
)

type Comment struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	PostID    uint           `gorm:"not null;index" json:"post_id"`
	Post      Post           `gorm:"foreignKey:PostID" json:"post,omitempty"`
	UserID    *uint          `gorm:"index" json:"user_id,omitempty"`
	User      *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
	ParentID  *uint          `gorm:"index" json:"parent_id,omitempty"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Status    string         `gorm:"not null;default:'pending';size:20" json:"status"` // pending, approved, rejected
	IP        string         `gorm:"size:45" json:"ip"`
	UserAgent string         `gorm:"size:500" json:"user_agent"`
}

// TableName 指定表名
func (Comment) TableName() string {
	return "comments"
}

