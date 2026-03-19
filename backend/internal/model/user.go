package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID          uint           `gorm:"primarykey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
	Username    string         `gorm:"uniqueIndex;not null;size:50" json:"username"`
	Email       string         `gorm:"uniqueIndex;not null;size:100" json:"email"`
	Password    string         `gorm:"not null;size:255" json:"-"`
	AvatarBase64 string        `gorm:"type:longtext" json:"avatar_base64"`
	DisplayName string         `gorm:"size:100" json:"display_name"`
	Bio         string         `gorm:"type:text" json:"bio"`
	Role        string         `gorm:"not null;default:'user';size:20" json:"role"`
	Status      string         `gorm:"not null;default:'active';size:20" json:"status"`
	Permissions UserPermissions `gorm:"type:json" json:"permissions"`
	// 邮箱验证字段
	IsEmailVerified         bool       `gorm:"default:false" json:"is_email_verified"`
	EmailVerificationToken  string     `gorm:"size:255" json:"-"`
	EmailVerificationSentAt *time.Time `json:"-"`
	Posts                   []Post     `gorm:"foreignKey:AuthorID" json:"posts,omitempty"`
}

// UserPermissions 用户权限结构
type UserPermissions struct {
	CanCreatePost             bool `json:"can_create_post"`
	CanEditPost               bool `json:"can_edit_post"`
	CanDeletePost             bool `json:"can_delete_post"`
	CanComment                bool `json:"can_comment"`
	CanViewPrivate            bool `json:"can_view_private"`
	CanCommentWithoutApproval bool `json:"can_comment_without_approval"`
}

// Scan 实现 sql.Scanner 接口
func (p *UserPermissions) Scan(value interface{}) error {
	if value == nil {
		*p = UserPermissions{CanComment: true}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		*p = UserPermissions{CanComment: true}
		return nil
	}
	return json.Unmarshal(bytes, p)
}

// Value 实现 driver.Valuer 接口
func (p UserPermissions) Value() (driver.Value, error) {
	return json.Marshal(p)
}

// TableName 指定表名
func (User) TableName() string {
	return "users"
}

// UserResponse 用户响应结构（不包含密码和头像）
// 注：为了性能优化，不返回 base64 头像数据，通过单独的接口获取
type UserResponse struct {
	ID              uint            `json:"id"`
	Username        string          `json:"username"`
	Email           string          `json:"email"`
	HasAvatar       bool            `json:"has_avatar"`      // 是否有头像
	DisplayName     string          `json:"display_name"`
	Bio             string          `json:"bio"`
	Role            string          `json:"role"`
	Status          string          `json:"status"`
	Permissions     UserPermissions `json:"permissions"`
	IsEmailVerified bool            `json:"is_email_verified"`
	CreatedAt       time.Time       `json:"created_at"`
}

// ToResponse 转换为响应结构（不包含base64头像，提升性能）
func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:              u.ID,
		Username:        u.Username,
		Email:           u.Email,
		HasAvatar:       u.AvatarBase64 != "", // 标记是否有头像
		DisplayName:     u.DisplayName,
		Bio:             u.Bio,
		Role:            u.Role,
		Status:          u.Status,
		Permissions:     u.Permissions,
		IsEmailVerified: u.IsEmailVerified,
		CreatedAt:       u.CreatedAt,
	}
}

// ToResponseWithAvatar 转换为包含头像的响应结构（仅在需要时使用）
func (u *User) ToResponseWithAvatar() map[string]interface{} {
	response := u.ToResponse()
	result := map[string]interface{}{
		"id":                response.ID,
		"username":          response.Username,
		"email":             response.Email,
		"has_avatar":        response.HasAvatar,
		"avatar_base64":     u.AvatarBase64, // 只在这里返回 base64
		"display_name":      response.DisplayName,
		"bio":               response.Bio,
		"role":              response.Role,
		"status":            response.Status,
		"permissions":       response.Permissions,
		"is_email_verified": response.IsEmailVerified,
		"created_at":        response.CreatedAt,
	}
	return result
}

