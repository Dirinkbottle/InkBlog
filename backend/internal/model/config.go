package model

// InstallConfig 安装配置
type InstallConfig struct {
	DBType     string `json:"db_type"`   // mysql or postgres
	DBHost     string `json:"db_host"`
	DBPort     string `json:"db_port"`
	DBUser     string `json:"db_user"`
	DBPass     string `json:"db_pass"`
	DBName     string `json:"db_name"`
	AdminUser  string `json:"admin_user"`
	AdminEmail string `json:"admin_email"`
	AdminPass  string `json:"admin_pass"`
}

// AppConfig 应用配置（保存到 config.json）
type AppConfig struct {
	Server struct {
		Port string `json:"port"`
		Mode string `json:"mode"`
	} `json:"server"`
	Database struct {
		Type     string `json:"type"`
		Host     string `json:"host"`
		Port     string `json:"port"`
		User     string `json:"user"`
		Password string `json:"password"`
		DBName   string `json:"dbname"`
	} `json:"database"`
	JWT struct {
		Secret            string `json:"secret"`
		Expiration        string `json:"expiration"`
		RefreshExpiration string `json:"refresh_expiration"`
	} `json:"jwt"`
	Upload struct {
		Path     string `json:"path"`
		MaxSize  int64  `json:"max_size"`
	} `json:"upload"`
	CORS struct {
		AllowedOrigins   []string `json:"allowed_origins"`
		AllowCredentials bool     `json:"allow_credentials"`
	} `json:"cors"`
	Notification struct {
		Port                  string `json:"port"`
		ServiceURL            string `json:"service_url"`
		ServiceToken          string `json:"service_token"`
		HeartbeatSeconds      int    `json:"heartbeat_seconds"`
		RequestTimeoutSeconds int    `json:"request_timeout_seconds"`
	} `json:"notification"`
}

