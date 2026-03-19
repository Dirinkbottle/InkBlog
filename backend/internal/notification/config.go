package notification

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	pkgconfig "inkblog-backend/pkg/config"
)

type Settings struct {
	Port              string
	ServiceURL        string
	ServiceToken      string
	ControlToken      string
	HeartbeatInterval time.Duration
	RequestTimeout    time.Duration
}

func LoadSettings() Settings {
	cfg := pkgconfig.AppConfig

	port := firstNonEmpty(
		os.Getenv("NOTIFICATION_PORT"),
		readConfig(func() string {
			if cfg == nil {
				return ""
			}
			return cfg.Notification.Port
		}),
		"13160",
	)

	serviceURL := strings.TrimRight(firstNonEmpty(
		os.Getenv("NOTIFICATION_SERVICE_URL"),
		readConfig(func() string {
			if cfg == nil {
				return ""
			}
			return cfg.Notification.ServiceURL
		}),
		fmt.Sprintf("http://127.0.0.1:%s", port),
	), "/")

	serviceToken := firstNonEmpty(
		os.Getenv("NOTIFICATION_SERVICE_TOKEN"),
		readConfig(func() string {
			if cfg == nil {
				return ""
			}
			return cfg.Notification.ServiceToken
		}),
		"inkblog-notification-dev-token",
	)

	controlToken := firstNonEmpty(
		os.Getenv("SERVICE_CONTROL_TOKEN"),
		"inkblog-service-control-dev-token",
	)

	heartbeatSeconds := firstPositiveInt(
		getEnvInt("NOTIFICATION_HEARTBEAT_SECONDS"),
		readConfigInt(func() int {
			if cfg == nil {
				return 0
			}
			return cfg.Notification.HeartbeatSeconds
		}),
		20,
	)

	requestTimeoutSeconds := firstPositiveInt(
		getEnvInt("NOTIFICATION_REQUEST_TIMEOUT_SECONDS"),
		readConfigInt(func() int {
			if cfg == nil {
				return 0
			}
			return cfg.Notification.RequestTimeoutSeconds
		}),
		3,
	)

	return Settings{
		Port:              port,
		ServiceURL:        serviceURL,
		ServiceToken:      serviceToken,
		ControlToken:      controlToken,
		HeartbeatInterval: time.Duration(heartbeatSeconds) * time.Second,
		RequestTimeout:    time.Duration(requestTimeoutSeconds) * time.Second,
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return value
		}
	}
	return ""
}

func getEnvInt(key string) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return 0
	}

	parsed, err := strconv.Atoi(value)
	if err != nil {
		return 0
	}

	return parsed
}

func firstPositiveInt(values ...int) int {
	for _, value := range values {
		if value > 0 {
			return value
		}
	}
	return 0
}

func readConfig(getter func() string) string {
	return getter()
}

func readConfigInt(getter func() int) int {
	return getter()
}
