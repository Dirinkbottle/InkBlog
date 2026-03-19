package corecontrol

import "time"

const (
	ActionStart   = "start"
	ActionStop    = "stop"
	ActionRestart = "restart"
)

type ServiceActionRequest struct {
	Action string `json:"action" binding:"required,oneof=start stop restart"`
}

type ServiceActionAvailability struct {
	Start   bool `json:"start"`
	Stop    bool `json:"stop"`
	Restart bool `json:"restart"`
}

type ServiceControlLock struct {
	ServiceID string    `json:"service_id"`
	Action    string    `json:"action"`
	Status    string    `json:"status"`
	StartedAt time.Time `json:"started_at"`
	ExpiresAt time.Time `json:"expires_at"`
}

type ServiceRuntime struct {
	Status        string     `json:"status"`
	Health        string     `json:"health"`
	CPUPercent    float64    `json:"cpu_percent"`
	MemoryBytes   uint64     `json:"memory_bytes"`
	UptimeSeconds int64      `json:"uptime_seconds"`
	LatencyMS     int64      `json:"latency_ms"`
	StartedAt     *time.Time `json:"started_at,omitempty"`
	ContainerName string     `json:"container_name,omitempty"`
	Image         string     `json:"image,omitempty"`
}

type ServiceSlotSnapshot struct {
	ID       string                    `json:"id"`
	Name     string                    `json:"name"`
	Kind     string                    `json:"kind"`
	Scope    string                    `json:"scope"`
	PanelKey string                    `json:"panel_key"`
	Runtime  ServiceRuntime            `json:"runtime"`
	Actions  ServiceActionAvailability `json:"actions"`
}

type ServiceSlotsResponse struct {
	Slots       []ServiceSlotSnapshot `json:"slots"`
	ControlLock *ServiceControlLock   `json:"control_lock,omitempty"`
}

type SlotDefinition struct {
	ID            string
	Name          string
	Kind          string
	Scope         string
	PanelKey      string
	ServiceName   string
	ContainerName string
	Probe         ProbeSpec
	PanelBaseURL  string
	Actions       ServiceActionAvailability
}

type ProbeSpec struct {
	Kind    string
	Target  string
	Timeout time.Duration
}

type probeResult struct {
	Healthy   bool
	LatencyMS int64
}

type proxyResponse struct {
	StatusCode  int
	ContentType string
	Body        []byte
}
