package model

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Name        string         `gorm:"uniqueIndex;not null;size:100" json:"name"`
	Slug        string         `gorm:"uniqueIndex;not null;size:100" json:"slug"`
	Description string         `gorm:"type:text" json:"description"`
	ParentID    *uint          `gorm:"index" json:"parent_id,omitempty"`
	SortOrder   int            `gorm:"default:0" json:"sort_order"`
	Posts       []Post         `gorm:"foreignKey:CategoryID" json:"posts,omitempty"`
}

// TableName 指定表名
func (Category) TableName() string {
	return "categories"
}

