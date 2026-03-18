package notification

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

type InternalClient struct {
	baseURL      string
	serviceToken string
	httpClient   *http.Client
}

func NewInternalClient(settings Settings) *InternalClient {
	return &InternalClient{
		baseURL:      strings.TrimRight(settings.ServiceURL, "/"),
		serviceToken: settings.ServiceToken,
		httpClient: &http.Client{
			Timeout: settings.RequestTimeout,
		},
	}
}

func (c *InternalClient) Enqueue(ctx context.Context, request EnqueueRequest) error {
	body, err := json.Marshal(request)
	if err != nil {
		return err
	}

	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/internal/notifications", bytes.NewReader(body))
	if err != nil {
		return err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.serviceToken)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		responseBody, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
		return fmt.Errorf("notification service enqueue failed: status=%d body=%s", resp.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	return nil
}
