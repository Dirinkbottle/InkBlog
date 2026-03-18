package bootstrap

import (
	"encoding/json"
	"fmt"
	"os"
	"time"

	"inkblog-backend/internal/database"
	"inkblog-backend/internal/model"
	pkgconfig "inkblog-backend/pkg/config"
)

func LoadInstalledAppConfig(configPath string) (*model.AppConfig, error) {
	configData, err := os.ReadFile(configPath)
	if err != nil {
		return nil, fmt.Errorf("failed to read %s: %w", configPath, err)
	}

	var appConfig model.AppConfig
	if err := json.Unmarshal(configData, &appConfig); err != nil {
		return nil, fmt.Errorf("failed to parse %s: %w", configPath, err)
	}

	return &appConfig, nil
}

func ApplyRuntimeConfig(appConfig *model.AppConfig) error {
	if appConfig == nil {
		return fmt.Errorf("app config is nil")
	}

	jwtExpiration, err := time.ParseDuration(appConfig.JWT.Expiration)
	if err != nil {
		jwtExpiration = 24 * time.Hour
	}

	jwtRefreshExpiration, err := time.ParseDuration(appConfig.JWT.RefreshExpiration)
	if err != nil {
		jwtRefreshExpiration = 168 * time.Hour
	}

	notificationPort := appConfig.Notification.Port
	if notificationPort == "" {
		notificationPort = "13160"
	}

	notificationServiceURL := appConfig.Notification.ServiceURL
	if notificationServiceURL == "" {
		notificationServiceURL = fmt.Sprintf("http://127.0.0.1:%s", notificationPort)
	}

	notificationServiceToken := appConfig.Notification.ServiceToken
	if notificationServiceToken == "" {
		notificationServiceToken = "inkblog-notification-dev-token"
	}

	runtimeConfig := &pkgconfig.Config{
		Server: pkgconfig.ServerConfig{
			Port: appConfig.Server.Port,
			Mode: appConfig.Server.Mode,
		},
		Database: pkgconfig.DatabaseConfig{
			Host:     appConfig.Database.Host,
			Port:     appConfig.Database.Port,
			User:     appConfig.Database.User,
			Password: appConfig.Database.Password,
			DBName:   appConfig.Database.DBName,
		},
		JWT: pkgconfig.JWTConfig{
			Secret:            appConfig.JWT.Secret,
			Expiration:        jwtExpiration,
			RefreshExpiration: jwtRefreshExpiration,
		},
		Upload: pkgconfig.UploadConfig{
			Path:    appConfig.Upload.Path,
			MaxSize: appConfig.Upload.MaxSize,
		},
		CORS: pkgconfig.CORSConfig{
			AllowedOrigins:   normalizeStringSlice(appConfig.CORS.AllowedOrigins, []string{"*"}),
			AllowCredentials: appConfig.CORS.AllowCredentials,
		},
		Notification: pkgconfig.NotificationConfig{
			Port:                  notificationPort,
			ServiceURL:            notificationServiceURL,
			ServiceToken:          notificationServiceToken,
			HeartbeatSeconds:      appConfig.Notification.HeartbeatSeconds,
			RequestTimeoutSeconds: appConfig.Notification.RequestTimeoutSeconds,
		},
	}

	pkgconfig.LoadConfigFromAppConfig(runtimeConfig)
	return nil
}

func InitDatabaseFromAppConfig(appConfig *model.AppConfig) error {
	if appConfig == nil {
		return fmt.Errorf("app config is nil")
	}

	if err := database.InitDB(
		appConfig.Database.Type,
		appConfig.Database.Host,
		appConfig.Database.Port,
		appConfig.Database.User,
		appConfig.Database.Password,
		appConfig.Database.DBName,
	); err != nil {
		return err
	}

	return database.EnsureNotificationSchema()
}

func normalizeStringSlice(value []string, fallback []string) []string {
	if len(value) == 0 {
		return fallback
	}
	return value
}
