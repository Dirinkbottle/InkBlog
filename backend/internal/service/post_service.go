package service

import (
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/service/post"
)

type CreatePostRequest = post.CreatePostRequest
type UpdatePostRequest = post.UpdatePostRequest
type PostQuery = post.PostQuery
type PostListResult = post.PostListResult

func CreatePost(req CreatePostRequest, authorID uint) (*model.PostDetailResponse, error) {
	return post.CreatePost(req, authorID)
}

func UpdatePost(id uint, req UpdatePostRequest, authorID uint) (*model.PostDetailResponse, error) {
	return post.UpdatePost(id, req, authorID)
}

func DeletePost(id uint, authorID uint, isAdmin bool) error {
	return post.DeletePost(id, authorID, isAdmin)
}

func GetPostList(query PostQuery) (*PostListResult, error) {
	return post.GetPostList(query)
}

func GetPostByID(id uint) (*model.PostDetailResponse, error) {
	return post.GetPostByID(id)
}

func GetPostBySlug(slug string) (*model.PostDetailResponse, error) {
	return post.GetPostBySlug(slug)
}

func PublishPost(id uint, authorID uint, isAdmin bool) error {
	return post.PublishPost(id, authorID, isAdmin)
}
