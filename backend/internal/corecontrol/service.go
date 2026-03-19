package corecontrol

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"
)

var errServiceActionInProgress = errors.New("service action already in progress")

const (
	controlLockTimeout      = 90 * time.Second
	controlLockPollInterval = 2 * time.Second
)

type Service struct {
	settings    Settings
	docker      *DockerClient
	httpClient  *http.Client
	catalog     []SlotDefinition
	mu          sync.Mutex
	controlLock *ServiceControlLock
}

func NewService(settings Settings) (*Service, error) {
	if strings.TrimSpace(settings.ServiceControlToken) == "" {
		return nil, fmt.Errorf("SERVICE_CONTROL_TOKEN is required")
	}

	return &Service{
		settings: settings,
		docker:   NewDockerClient(settings.DockerSocketPath, settings.RequestTimeout),
		httpClient: &http.Client{
			Timeout: settings.RequestTimeout,
		},
		catalog: BuildCatalog(settings),
	}, nil
}

func (s *Service) ListSlots(ctx context.Context) (ServiceSlotsResponse, error) {
	results := make([]ServiceSlotSnapshot, len(s.catalog))
	var wg sync.WaitGroup

	for idx := range s.catalog {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			results[i] = s.snapshotSlot(ctx, s.catalog[i])
		}(idx)
	}

	wg.Wait()
	return ServiceSlotsResponse{
		Slots:       results,
		ControlLock: s.currentControlLock(),
	}, nil
}

func (s *Service) RunAction(ctx context.Context, serviceID, action string) (*ServiceControlLock, error) {
	slot, ok := s.findSlot(serviceID)
	if !ok {
		return nil, fmt.Errorf("service not found")
	}

	switch action {
	case ActionStart:
		if !slot.Actions.Start {
			return nil, fmt.Errorf("start is not allowed for %s", serviceID)
		}
	case ActionStop:
		if !slot.Actions.Stop {
			return nil, fmt.Errorf("stop is not allowed for %s", serviceID)
		}
	case ActionRestart:
		if !slot.Actions.Restart {
			return nil, fmt.Errorf("restart is not allowed for %s", serviceID)
		}
	default:
		return nil, fmt.Errorf("unsupported action: %s", action)
	}

	lock, err := s.acquireControlLock(serviceID, action)
	if err != nil {
		return nil, err
	}

	if err := s.docker.ContainerAction(ctx, slot.ContainerName, action); err != nil {
		s.clearControlLockIfMatch(lock)
		return nil, err
	}

	go s.watchAction(lock, slot, action)

	return cloneControlLock(lock), nil
}

func (s *Service) ProxyPanel(ctx context.Context, serviceID, method, panelPath, rawQuery, contentType string, body []byte) (*proxyResponse, error) {
	slot, ok := s.findSlot(serviceID)
	if !ok {
		return nil, fmt.Errorf("service not found")
	}
	if strings.TrimSpace(slot.PanelBaseURL) == "" {
		return nil, fmt.Errorf("service does not expose a control panel")
	}

	panelPath = strings.TrimPrefix(panelPath, "/")
	if panelPath == "" {
		return nil, fmt.Errorf("panel path is required")
	}

	targetURL := strings.TrimRight(slot.PanelBaseURL, "/") + "/internal/control/panel/" + panelPath
	if rawQuery != "" {
		targetURL += "?" + rawQuery
	}

	req, err := http.NewRequestWithContext(ctx, method, targetURL, bytes.NewReader(body))
	if err != nil {
		return nil, err
	}

	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	req.Header.Set("Authorization", "Bearer "+s.settings.ServiceControlToken)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return &proxyResponse{
		StatusCode:  resp.StatusCode,
		ContentType: resp.Header.Get("Content-Type"),
		Body:        responseBody,
	}, nil
}

func (s *Service) snapshotSlot(ctx context.Context, slot SlotDefinition) ServiceSlotSnapshot {
	snapshot := ServiceSlotSnapshot{
		ID:       slot.ID,
		Name:     slot.Name,
		Kind:     slot.Kind,
		Scope:    slot.Scope,
		PanelKey: slot.PanelKey,
		Actions:  slot.Actions,
		Runtime: ServiceRuntime{
			Status:        "unknown",
			Health:        "unknown",
			ContainerName: slot.ContainerName,
		},
	}

	inspect, err := s.docker.InspectContainer(ctx, slot.ContainerName)
	if err != nil {
		snapshot.Runtime.Status = "missing"
		snapshot.Runtime.Health = "unreachable"
		return snapshot
	}

	snapshot.Runtime.ContainerName = strings.TrimPrefix(inspect.Name, "/")
	snapshot.Runtime.Image = inspect.Config.Image
	snapshot.Runtime.Status = inspect.State.Status
	snapshot.Runtime.Health = dockerHealthStatus(inspect)

	startedAt, err := defaultStartedAt(inspect.State.StartedAt)
	if err == nil {
		snapshot.Runtime.StartedAt = startedAt
		if startedAt != nil && inspect.State.Running {
			snapshot.Runtime.UptimeSeconds = int64(time.Since(*startedAt).Seconds())
		}
	}

	if inspect.State.Running {
		if stats, err := s.docker.ContainerStats(ctx, slot.ContainerName); err == nil {
			snapshot.Runtime.CPUPercent = calculateCPUPercent(stats)
			snapshot.Runtime.MemoryBytes = calculateMemoryBytes(stats)
		}

		if probe, err := s.probe(ctx, slot.Probe); err == nil {
			snapshot.Runtime.LatencyMS = probe.LatencyMS
			if inspect.State.Health == nil {
				if probe.Healthy {
					snapshot.Runtime.Health = "healthy"
				} else {
					snapshot.Runtime.Health = "unhealthy"
				}
			}
		} else if inspect.State.Health == nil {
			snapshot.Runtime.Health = "unhealthy"
		}
	}

	return snapshot
}

func (s *Service) probe(ctx context.Context, probe ProbeSpec) (probeResult, error) {
	switch probe.Kind {
	case probeHTTP:
		return s.httpProbe(ctx, probe)
	case probeTCP:
		return tcpProbe(ctx, probe)
	default:
		return probeResult{}, fmt.Errorf("unsupported probe kind: %s", probe.Kind)
	}
}

func (s *Service) httpProbe(ctx context.Context, probe ProbeSpec) (probeResult, error) {
	started := time.Now()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, probe.Target, nil)
	if err != nil {
		return probeResult{}, err
	}

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return probeResult{}, err
	}
	defer resp.Body.Close()
	io.Copy(io.Discard, io.LimitReader(resp.Body, 256))

	return probeResult{
		Healthy:   resp.StatusCode < 500,
		LatencyMS: time.Since(started).Milliseconds(),
	}, nil
}

func tcpProbe(ctx context.Context, probe ProbeSpec) (probeResult, error) {
	started := time.Now()
	dialer := &net.Dialer{Timeout: probe.Timeout}
	conn, err := dialer.DialContext(ctx, "tcp", probe.Target)
	if err != nil {
		return probeResult{}, err
	}
	_ = conn.Close()

	return probeResult{
		Healthy:   true,
		LatencyMS: time.Since(started).Milliseconds(),
	}, nil
}

func (s *Service) findSlot(serviceID string) (SlotDefinition, bool) {
	for _, slot := range s.catalog {
		if slot.ID == serviceID {
			return slot, true
		}
	}
	return SlotDefinition{}, false
}

func (s *Service) currentControlLock() *ServiceControlLock {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.controlLock == nil {
		return nil
	}
	if time.Now().After(s.controlLock.ExpiresAt) {
		s.controlLock = nil
		return nil
	}

	return cloneControlLock(s.controlLock)
}

func (s *Service) acquireControlLock(serviceID, action string) (*ServiceControlLock, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.controlLock != nil {
		if time.Now().After(s.controlLock.ExpiresAt) {
			s.controlLock = nil
		} else {
			return nil, fmt.Errorf("%w: %s %s", errServiceActionInProgress, s.controlLock.ServiceID, s.controlLock.Action)
		}
	}

	startedAt := time.Now()
	lock := &ServiceControlLock{
		ServiceID: serviceID,
		Action:    action,
		Status:    "in_progress",
		StartedAt: startedAt,
		ExpiresAt: startedAt.Add(controlLockTimeout),
	}

	s.controlLock = lock
	return lock, nil
}

func (s *Service) clearControlLockIfMatch(lock *ServiceControlLock) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.controlLock == nil {
		return
	}

	if s.controlLock.ServiceID == lock.ServiceID &&
		s.controlLock.Action == lock.Action &&
		s.controlLock.StartedAt.Equal(lock.StartedAt) {
		s.controlLock = nil
	}
}

func (s *Service) watchAction(lock *ServiceControlLock, slot SlotDefinition, action string) {
	ticker := time.NewTicker(controlLockPollInterval)
	defer ticker.Stop()

	timeout := time.NewTimer(time.Until(lock.ExpiresAt))
	defer timeout.Stop()

	for {
		reachedTarget, err := s.actionReachedTarget(slot, action)
		if err == nil && reachedTarget {
			s.clearControlLockIfMatch(lock)
			return
		}

		select {
		case <-ticker.C:
		case <-timeout.C:
			s.clearControlLockIfMatch(lock)
			return
		}
	}
}

func (s *Service) actionReachedTarget(slot SlotDefinition, action string) (bool, error) {
	ctx, cancel := context.WithTimeout(context.Background(), s.settings.RequestTimeout)
	defer cancel()

	inspect, err := s.docker.InspectContainer(ctx, slot.ContainerName)
	if err != nil {
		return false, err
	}

	switch action {
	case ActionStart, ActionRestart:
		if !inspect.State.Running || inspect.State.Status != "running" {
			return false, nil
		}

		health := dockerHealthStatus(inspect)
		if health == "healthy" {
			return true, nil
		}
		if health == "unknown" {
			probe, err := s.probe(ctx, slot.Probe)
			if err != nil {
				return false, nil
			}
			return probe.Healthy, nil
		}
		return false, nil

	case ActionStop:
		if inspect.State.Status != "exited" && inspect.State.Status != "dead" {
			return false, nil
		}

		probeCtx, probeCancel := context.WithTimeout(context.Background(), s.settings.RequestTimeout)
		defer probeCancel()

		if _, err := s.probe(probeCtx, slot.Probe); err == nil {
			return false, nil
		}
		return true, nil

	default:
		return false, fmt.Errorf("unsupported action: %s", action)
	}
}

func cloneControlLock(lock *ServiceControlLock) *ServiceControlLock {
	if lock == nil {
		return nil
	}

	cloned := *lock
	return &cloned
}

func dockerHealthStatus(inspect dockerContainerInspect) string {
	if inspect.State.Health != nil && strings.TrimSpace(inspect.State.Health.Status) != "" {
		return inspect.State.Health.Status
	}

	switch inspect.State.Status {
	case "running":
		return "unknown"
	case "exited", "dead":
		return "stopped"
	default:
		return inspect.State.Status
	}
}

func calculateCPUPercent(stats dockerContainerStats) float64 {
	cpuDelta := float64(stats.CPUStats.CPUUsage.TotalUsage - stats.PreCPUStats.CPUUsage.TotalUsage)
	systemDelta := float64(stats.CPUStats.SystemCPUUsage - stats.PreCPUStats.SystemCPUUsage)
	if cpuDelta <= 0 || systemDelta <= 0 {
		return 0
	}

	onlineCPUs := float64(stats.CPUStats.OnlineCPUs)
	if onlineCPUs == 0 {
		onlineCPUs = float64(len(stats.CPUStats.CPUUsage.PercpuUsage))
	}
	if onlineCPUs == 0 {
		onlineCPUs = 1
	}

	return cpuDelta / systemDelta * onlineCPUs * 100
}

func calculateMemoryBytes(stats dockerContainerStats) uint64 {
	usage := stats.MemoryStats.Usage
	if usage == 0 {
		return 0
	}

	cache := stats.MemoryStats.Stats["cache"]
	if cache == 0 {
		cache = stats.MemoryStats.Stats["inactive_file"]
	}
	if cache > 0 && usage > cache {
		return usage - cache
	}

	return usage
}

func sortSnapshotsByCatalog(slots []ServiceSlotSnapshot, catalog []SlotDefinition) {
	order := make(map[string]int, len(catalog))
	for i, slot := range catalog {
		order[slot.ID] = i
	}
	sort.Slice(slots, func(i, j int) bool {
		return order[slots[i].ID] < order[slots[j].ID]
	})
}
