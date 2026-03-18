package post

import "inkblog-backend/internal/model"

type CreatePostRequest struct {
	Title      string `json:"title" binding:"required,min=1,max=255"`
	Content    string `json:"content" binding:"required"`
	Summary    string `json:"summary"`
	CoverImage string `json:"cover_image"`
	CategoryID uint   `json:"category_id"`
	TagIDs     []uint `json:"tag_ids"`
	Status     string `json:"status"`
}

type UpdatePostRequest struct {
	Title      string `json:"title" binding:"required,min=1,max=255"`
	Content    string `json:"content" binding:"required"`
	Summary    string `json:"summary"`
	CoverImage string `json:"cover_image"`
	CategoryID uint   `json:"category_id"`
	TagIDs     []uint `json:"tag_ids"`
	Status     string `json:"status"`
}

type PostQuery struct {
	Page       int    `form:"page,default=1"`
	PageSize   int    `form:"page_size,default=10"`
	CategoryID string `form:"category_id"`
	TagID      string `form:"tag_id"`
	Status     string `form:"status"`
	Search     string `form:"search"`
	AuthorID   uint   `form:"author_id"`
}

type PostListResult struct {
	Posts      []model.PostListResponse `json:"posts"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	PageSize   int                      `json:"page_size"`
	TotalPages int                      `json:"total_pages"`
}
