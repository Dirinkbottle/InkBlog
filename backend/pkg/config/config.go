package config

import (
	"log"
	"time"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Upload   UploadConfig
	CORS     CORSConfig
	Notification NotificationConfig
}

type ServerConfig struct {
	Port string
	Mode string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret            string
	Expiration        time.Duration
	RefreshExpiration time.Duration
}

type UploadConfig struct {
	Path         string
	MaxSize      int64
	AllowedTypes []string
}

type CORSConfig struct {
	AllowedOrigins   []string
	AllowCredentials bool
}

type NotificationConfig struct {
	Port                  string
	ServiceURL            string
	ServiceToken          string
	HeartbeatSeconds      int
	RequestTimeoutSeconds int
}

var AppConfig *Config

// LoadConfigFromAppConfig 从 AppConfig 结构加载配置到全局（用于安装后立即生效）
func LoadConfigFromAppConfig(cfg *Config) {
	AppConfig = cfg
	log.Printf("Configuration loaded from AppConfig structure")
}

func LoadConfig() error {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./backend")

	// 读取环境变量
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Printf("Error reading config file: %v", err)
		return err
	}

	AppConfig = &Config{
		Server: ServerConfig{
			Port: viper.GetString("server.port"),
			Mode: viper.GetString("server.mode"),
		},
		Database: DatabaseConfig{
			Host:     viper.GetString("database.host"),
			Port:     viper.GetString("database.port"),
			User:     viper.GetString("database.user"),
			Password: viper.GetString("database.password"),
			DBName:   viper.GetString("database.dbname"),
			SSLMode:  viper.GetString("database.sslmode"),
		},
		Redis: RedisConfig{
			Host:     viper.GetString("redis.host"),
			Port:     viper.GetString("redis.port"),
			Password: viper.GetString("redis.password"),
			DB:       viper.GetInt("redis.db"),
		},
		JWT: JWTConfig{
			Secret:            viper.GetString("jwt.secret"),
			Expiration:        viper.GetDuration("jwt.expiration"),
			RefreshExpiration: viper.GetDuration("jwt.refresh_expiration"),
		},
		Upload: UploadConfig{
			Path:         viper.GetString("upload.path"),
			MaxSize:      viper.GetInt64("upload.max_size"),
			AllowedTypes: viper.GetStringSlice("upload.allowed_types"),
		},
		CORS: CORSConfig{
			AllowedOrigins:   viper.GetStringSlice("cors.allowed_origins"),
			AllowCredentials: viper.GetBool("cors.allow_credentials"),
		},
		Notification: NotificationConfig{
			Port:                  viper.GetString("notification.port"),
			ServiceURL:            viper.GetString("notification.service_url"),
			ServiceToken:          viper.GetString("notification.service_token"),
			HeartbeatSeconds:      viper.GetInt("notification.heartbeat_seconds"),
			RequestTimeoutSeconds: viper.GetInt("notification.request_timeout_seconds"),
		},
	}

	return nil
}

