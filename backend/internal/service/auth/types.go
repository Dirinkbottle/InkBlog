package auth

import "inkblog-backend/internal/model"

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	User         model.UserResponse `json:"user"`
	Token        string             `json:"token"`
	RefreshToken string             `json:"refresh_token"`
}
