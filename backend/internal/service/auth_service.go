package service

import (
	"inkblog-backend/internal/model"
	"inkblog-backend/internal/service/auth"
)

type RegisterRequest = auth.RegisterRequest
type LoginRequest = auth.LoginRequest
type AuthResponse = auth.AuthResponse

func Register(req RegisterRequest) (*model.User, error) {
	return auth.Register(req)
}

func Login(req LoginRequest) (*AuthResponse, error) {
	return auth.Login(req)
}

func RefreshToken(refreshToken string) (*AuthResponse, error) {
	return auth.RefreshToken(refreshToken)
}

func GetProfile(userID uint) (*model.UserResponse, error) {
	return auth.GetProfile(userID)
}
