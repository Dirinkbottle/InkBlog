package corecontrol

import (
	"os"
	"strconv"
	"strings"
	"time"
)

type Settings struct {
	Port                string
	DockerSocketPath    string
	ComposeProjectName  string
	ServiceControlToken string
	RequestTimeout      time.Duration
}

func LoadSettings() Settings {
	timeoutSeconds := parsePositiveInt(os.Getenv("CORE_CONTROL_REQUEST_TIMEOUT_SECONDS"), 5)

	return Settings{
		Port:                firstNonEmpty(os.Getenv("CORE_CONTROL_PORT"), "13170"),
		DockerSocketPath:    firstNonEmpty(os.Getenv("DOCKER_SOCKET_PATH"), "/var/run/docker.sock"),
		ComposeProjectName:  firstNonEmpty(os.Getenv("COMPOSE_PROJECT_NAME"), "inkblog"),
		ServiceControlToken: firstNonEmpty(os.Getenv("SERVICE_CONTROL_TOKEN"), "inkblog-service-control-dev-token"),
		RequestTimeout:      time.Duration(timeoutSeconds) * time.Second,
	}
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if strings.TrimSpace(value) != "" {
			return strings.TrimSpace(value)
		}
	}
	return ""
}

func parsePositiveInt(value string, fallback int) int {
	value = strings.TrimSpace(value)
	if value == "" {
		return fallback
	}

	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}

	return parsed
}
