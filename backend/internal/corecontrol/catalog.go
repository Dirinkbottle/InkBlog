package corecontrol

import (
	"fmt"
	"time"
)

const (
	probeHTTP = "http"
	probeTCP  = "tcp"
)

func BuildCatalog(settings Settings) []SlotDefinition {
	timeout := settings.RequestTimeout

	return []SlotDefinition{
		{
			ID:            "backend",
			Name:          "Backend",
			Kind:          "go-api",
			Scope:         "app",
			PanelKey:      "default",
			ServiceName:   "backend",
			ContainerName: composeContainerName(settings.ComposeProjectName, "backend"),
			Probe: ProbeSpec{
				Kind:    probeHTTP,
				Target:  "http://backend:13150/health",
				Timeout: timeout,
			},
			Actions: ServiceActionAvailability{Start: true, Stop: true, Restart: true},
		},
		{
			ID:            "notification",
			Name:          "Notification",
			Kind:          "go-worker",
			Scope:         "app",
			PanelKey:      "notification",
			ServiceName:   "notification",
			ContainerName: composeContainerName(settings.ComposeProjectName, "notification"),
			Probe: ProbeSpec{
				Kind:    probeHTTP,
				Target:  "http://notification:13160/health",
				Timeout: timeout,
			},
			PanelBaseURL: "http://notification:13160",
			Actions:      ServiceActionAvailability{Start: true, Stop: true, Restart: true},
		},
		{
			ID:            "web",
			Name:          "Web",
			Kind:          "frontend",
			Scope:         "app",
			PanelKey:      "default",
			ServiceName:   "web",
			ContainerName: composeContainerName(settings.ComposeProjectName, "web"),
			Probe: ProbeSpec{
				Kind:    probeHTTP,
				Target:  "http://web/health",
				Timeout: timeout,
			},
			Actions: ServiceActionAvailability{Start: true, Stop: true, Restart: true},
		},
		{
			ID:            "mysql",
			Name:          "MySQL",
			Kind:          "database",
			Scope:         "infra",
			PanelKey:      "default",
			ServiceName:   "mysql",
			ContainerName: composeContainerName(settings.ComposeProjectName, "mysql"),
			Probe: ProbeSpec{
				Kind:    probeTCP,
				Target:  "mysql:3306",
				Timeout: timeout,
			},
			Actions: ServiceActionAvailability{Start: true, Stop: true, Restart: true},
		},
		{
			ID:            "redis",
			Name:          "Redis",
			Kind:          "cache",
			Scope:         "infra",
			PanelKey:      "default",
			ServiceName:   "redis",
			ContainerName: composeContainerName(settings.ComposeProjectName, "redis"),
			Probe: ProbeSpec{
				Kind:    probeTCP,
				Target:  "redis:6379",
				Timeout: timeout,
			},
			Actions: ServiceActionAvailability{Start: true, Stop: true, Restart: true},
		},
		{
			ID:            "core-control",
			Name:          "Core Control",
			Kind:          "control-plane",
			Scope:         "app",
			PanelKey:      "default",
			ServiceName:   "core-control",
			ContainerName: composeContainerName(settings.ComposeProjectName, "core-control"),
			Probe: ProbeSpec{
				Kind:    probeHTTP,
				Target:  fmt.Sprintf("http://core-control:%s/health", settings.Port),
				Timeout: timeout,
			},
			Actions: ServiceActionAvailability{},
		},
	}
}

func composeContainerName(project, service string) string {
	return fmt.Sprintf("%s-%s", project, service)
}

func defaultStartedAt(value string) (*time.Time, error) {
	if value == "" || value == "0001-01-01T00:00:00Z" {
		return nil, nil
	}
	parsed, err := time.Parse(time.RFC3339Nano, value)
	if err != nil {
		return nil, err
	}
	return &parsed, nil
}
