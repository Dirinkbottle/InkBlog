package post

import (
	"errors"
	"fmt"
	"strconv"

	"gorm.io/gorm"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
)

func GetPostList(query PostQuery) (*PostListResult, error) {
	db := database.GetDB()

	fmt.Printf("[PostService] GetPostList called with params: page=%d, pageSize=%d, categoryID=%s, tagID=%s, status=%s, search=%s\n",
		query.Page, query.PageSize, query.CategoryID, query.TagID, query.Status, query.Search)

	queryBuilder := db.Model(&model.Post{}).
		Preload("Author").
		Preload("Category").
		Preload("Tags")

	if query.Status != "" {
		queryBuilder = queryBuilder.Where("status = ?", query.Status)
		fmt.Printf("[PostService] Filter by status: %s\n", query.Status)
	}

	if query.AuthorID > 0 {
		queryBuilder = queryBuilder.Where("author_id = ?", query.AuthorID)
		fmt.Printf("[PostService] Filter by author ID: %d\n", query.AuthorID)
	}

	if query.CategoryID != "" {
		if categoryID, err := strconv.ParseUint(query.CategoryID, 10, 32); err == nil && categoryID > 0 {
			queryBuilder = queryBuilder.Where("category_id = ?", categoryID)
			fmt.Printf("[PostService] Filter by category ID: %d\n", categoryID)
		} else {
			var category model.Category
			if err := db.Where("slug = ?", query.CategoryID).First(&category).Error; err == nil {
				queryBuilder = queryBuilder.Where("category_id = ?", category.ID)
				fmt.Printf("[PostService] Filter by category slug '%s' (resolved to ID: %d)\n", query.CategoryID, category.ID)
			} else {
				fmt.Printf("[PostService] Warning: Category slug '%s' not found\n", query.CategoryID)
				return nil, fmt.Errorf("分类不存在: %s", query.CategoryID)
			}
		}
	}

	if query.TagID != "" {
		if tagID, err := strconv.ParseUint(query.TagID, 10, 32); err == nil && tagID > 0 {
			queryBuilder = queryBuilder.Joins("JOIN post_tags ON post_tags.post_id = posts.id").
				Where("post_tags.tag_id = ?", tagID)
			fmt.Printf("[PostService] Filter by tag ID: %d\n", tagID)
		} else {
			var tag model.Tag
			if err := db.Where("slug = ?", query.TagID).First(&tag).Error; err == nil {
				queryBuilder = queryBuilder.Joins("JOIN post_tags ON post_tags.post_id = posts.id").
					Where("post_tags.tag_id = ?", tag.ID)
				fmt.Printf("[PostService] Filter by tag slug '%s' (resolved to ID: %d)\n", query.TagID, tag.ID)
			} else {
				fmt.Printf("[PostService] Warning: Tag slug '%s' not found\n", query.TagID)
				return nil, fmt.Errorf("标签不存在: %s", query.TagID)
			}
		}
	}

	if query.Search != "" {
		searchTerm := "%" + query.Search + "%"
		queryBuilder = queryBuilder.Where("title LIKE ? OR content LIKE ?", searchTerm, searchTerm)
		fmt.Printf("[PostService] Filter by search term: %s\n", query.Search)
	}

	var total int64
	if err := queryBuilder.Count(&total).Error; err != nil {
		fmt.Printf("[PostService] Error counting posts: %v\n", err)
		return nil, errors.New("数据库查询失败")
	}
	fmt.Printf("[PostService] Total posts found: %d\n", total)

	if query.Page < 1 {
		query.Page = 1
	}
	if query.PageSize < 1 || query.PageSize > 100 {
		query.PageSize = 10
	}

	offset := (query.Page - 1) * query.PageSize

	var posts []model.Post
	if err := queryBuilder.
		Order("created_at DESC").
		Limit(query.PageSize).
		Offset(offset).
		Find(&posts).Error; err != nil {
		fmt.Printf("[PostService] Error fetching posts: %v\n", err)
		return nil, errors.New("数据库查询失败")
	}
	fmt.Printf("[PostService] Successfully fetched %d posts\n", len(posts))

	postIDs := make([]uint, len(posts))
	for i, post := range posts {
		postIDs[i] = post.ID
	}

	type CommentCount struct {
		PostID uint
		Count  int64
	}
	var commentCounts []CommentCount
	if len(postIDs) > 0 {
		db.Model(&model.Comment{}).
			Select("post_id, count(*) as count").
			Where("post_id IN ? AND status = ?", postIDs, "approved").
			Group("post_id").
			Scan(&commentCounts)
	}

	commentCountMap := make(map[uint]int)
	for _, cc := range commentCounts {
		commentCountMap[cc.PostID] = int(cc.Count)
	}

	postResponses := make([]model.PostListResponse, len(posts))
	for i, post := range posts {
		postResponses[i] = post.ToListResponse()
		postResponses[i].CommentCount = commentCountMap[post.ID]
	}

	totalPages := int(total) / query.PageSize
	if int(total)%query.PageSize > 0 {
		totalPages++
	}

	fmt.Printf("[PostService] Returning page %d/%d with %d posts\n", query.Page, totalPages, len(posts))
	return &PostListResult{
		Posts:      postResponses,
		Total:      total,
		Page:       query.Page,
		PageSize:   query.PageSize,
		TotalPages: totalPages,
	}, nil
}

func GetPostByID(id uint) (*model.PostDetailResponse, error) {
	db := database.GetDB()

	var post model.Post
	if err := db.
		Preload("Author").
		Preload("Category").
		Preload("Tags").
		First(&post, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("文章不存在")
		}
		return nil, errors.New("数据库查询失败")
	}

	db.Model(&post).Update("views", gorm.Expr("views + ?", 1))

	var commentCount int64
	db.Model(&model.Comment{}).
		Where("post_id = ? AND status = ?", post.ID, "approved").
		Count(&commentCount)

	response := post.ToDetailResponse()
	response.CommentCount = int(commentCount)
	return &response, nil
}

func GetPostBySlug(slug string) (*model.PostDetailResponse, error) {
	db := database.GetDB()

	var post model.Post
	if err := db.
		Preload("Author").
		Preload("Category").
		Preload("Tags").
		Where("slug = ?", slug).
		First(&post).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("文章不存在")
		}
		return nil, errors.New("数据库查询失败")
	}

	db.Model(&post).Update("views", gorm.Expr("views + ?", 1))

	var commentCount int64
	db.Model(&model.Comment{}).
		Where("post_id = ? AND status = ?", post.ID, "approved").
		Count(&commentCount)

	response := post.ToDetailResponse()
	response.CommentCount = int(commentCount)
	return &response, nil
}
