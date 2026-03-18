package model

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Title       string         `gorm:"not null;size:255" json:"title"`
	Slug        string         `gorm:"uniqueIndex;not null;size:255" json:"slug"`
	Content     string         `gorm:"type:text;not null" json:"content"`
	Summary     string         `gorm:"type:text" json:"summary"`
	CoverImage  string         `gorm:"size:500" json:"cover_image"`
	AuthorID    uint           `gorm:"not null;index" json:"author_id"`
	Author      User           `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	CategoryID  uint           `gorm:"index" json:"category_id"`
	Category    *Category      `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags        []Tag          `gorm:"many2many:post_tags;" json:"tags,omitempty"`
	Status      string         `gorm:"not null;default:'draft';size:20" json:"status"` // draft, published
	Views       int            `gorm:"default:0" json:"views"`
	Likes       int            `gorm:"default:0" json:"likes"`
	PublishedAt *time.Time     `json:"published_at,omitempty"`
}

// TableName 指定表名
func (Post) TableName() string {
	return "posts"
}

// PostListResponse 文章列表响应
type PostListResponse struct {
	ID           uint         `json:"id"`
	Title        string       `json:"title"`
	Slug         string       `json:"slug"`
	Summary      string       `json:"summary"`
	CoverImage   string       `json:"cover_image"`
	Author       UserResponse `json:"author"`
	Category     *Category    `json:"category,omitempty"`
	Tags         []Tag        `json:"tags,omitempty"`
	Status       string       `json:"status"`
	Views        int          `json:"views"`
	Likes        int          `json:"likes"`
	CommentCount int          `json:"comment_count"`
	CreatedAt    time.Time    `json:"created_at"`
	PublishedAt  *time.Time   `json:"published_at,omitempty"`
}

// PostDetailResponse 文章详情响应
type PostDetailResponse struct {
	PostListResponse
	Content string `json:"content"`
}

// ToListResponse 转换为列表响应
func (p *Post) ToListResponse() PostListResponse {
	return PostListResponse{
		ID:          p.ID,
		Title:       p.Title,
		Slug:        p.Slug,
		Summary:     p.Summary,
		CoverImage:  p.CoverImage,
		Author:      p.Author.ToResponse(),
		Category:    p.Category,
		Tags:        p.Tags,
		Status:      p.Status,
		Views:       p.Views,
		Likes:       p.Likes,
		CreatedAt:   p.CreatedAt,
		PublishedAt: p.PublishedAt,
	}
}

// ToDetailResponse 转换为详情响应
func (p *Post) ToDetailResponse() PostDetailResponse {
	return PostDetailResponse{
		PostListResponse: p.ToListResponse(),
		Content:          p.Content,
	}
}

