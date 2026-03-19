package corecontrol

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type DockerClient struct {
	httpClient *http.Client
}

type dockerContainerInspect struct {
	Name   string `json:"Name"`
	Config struct {
		Image string `json:"Image"`
	} `json:"Config"`
	State struct {
		Status    string `json:"Status"`
		Running   bool   `json:"Running"`
		StartedAt string `json:"StartedAt"`
		Health    *struct {
			Status string `json:"Status"`
		} `json:"Health"`
	} `json:"State"`
}

type dockerContainerStats struct {
	CPUStats struct {
		CPUUsage struct {
			TotalUsage  uint64   `json:"total_usage"`
			PercpuUsage []uint64 `json:"percpu_usage"`
		} `json:"cpu_usage"`
		SystemCPUUsage uint64 `json:"system_cpu_usage"`
		OnlineCPUs     uint64 `json:"online_cpus"`
	} `json:"cpu_stats"`
	PreCPUStats struct {
		CPUUsage struct {
			TotalUsage uint64 `json:"total_usage"`
		} `json:"cpu_usage"`
		SystemCPUUsage uint64 `json:"system_cpu_usage"`
	} `json:"precpu_stats"`
	MemoryStats struct {
		Usage uint64            `json:"usage"`
		Stats map[string]uint64 `json:"stats"`
	} `json:"memory_stats"`
}

func NewDockerClient(socketPath string, timeout time.Duration) *DockerClient {
	transport := &http.Transport{
		DialContext: func(ctx context.Context, network, addr string) (net.Conn, error) {
			return (&net.Dialer{}).DialContext(ctx, "unix", socketPath)
		},
	}

	return &DockerClient{
		httpClient: &http.Client{
			Transport: transport,
			Timeout:   timeout,
		},
	}
}

func (c *DockerClient) InspectContainer(ctx context.Context, containerName string) (dockerContainerInspect, error) {
	var result dockerContainerInspect
	if err := c.doJSON(ctx, http.MethodGet, "/containers/"+url.PathEscape(containerName)+"/json", nil, &result); err != nil {
		return dockerContainerInspect{}, err
	}
	return result, nil
}

func (c *DockerClient) ContainerStats(ctx context.Context, containerName string) (dockerContainerStats, error) {
	var result dockerContainerStats
	if err := c.doJSON(ctx, http.MethodGet, "/containers/"+url.PathEscape(containerName)+"/stats?stream=false", nil, &result); err != nil {
		return dockerContainerStats{}, err
	}
	return result, nil
}

func (c *DockerClient) ContainerAction(ctx context.Context, containerName, action string) error {
	path := "/containers/" + url.PathEscape(containerName)
	switch action {
	case ActionStart:
		path += "/start"
	case ActionStop:
		path += "/stop?t=10"
	case ActionRestart:
		path += "/restart?t=10"
	default:
		return fmt.Errorf("unsupported action: %s", action)
	}

	resp, err := c.do(ctx, http.MethodPost, path, nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusNotModified {
		return nil
	}

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
	return fmt.Errorf("docker action failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(body)))
}

func (c *DockerClient) doJSON(ctx context.Context, method, path string, body io.Reader, out interface{}) error {
	resp, err := c.do(ctx, method, path, body)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		responseBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("docker request failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *DockerClient) do(ctx context.Context, method, path string, body io.Reader) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, method, "http://unix"+path, body)
	if err != nil {
		return nil, err
	}

	return c.httpClient.Do(req)
}
