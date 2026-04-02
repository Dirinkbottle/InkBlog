package corecontrol

import (
	"archive/tar"
	"bufio"
	"compress/gzip"
	"context"
	"crypto/subtle"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	defaultDeployReleaseRoot = "/app/release"
	deployPushTokenEnv       = "DEPLOY_PUSH_TOKEN"
	deployReleaseRootEnv     = "DEPLOY_RELEASE_ROOT"
	maxDeployBundleSize      = 1 << 30 // 1 GiB
)

func registerDeployRoutes(r *gin.Engine, service *Service) {
	r.POST("/api/v1/deploy/push", func(c *gin.Context) {
		expectedToken := strings.TrimSpace(os.Getenv(deployPushTokenEnv))
		if expectedToken == "" {
			c.JSON(http.StatusServiceUnavailable, gin.H{"message": "deploy endpoint is disabled"})
			return
		}

		token := extractBearerToken(c.GetHeader("Authorization"))
		if token == "" || subtle.ConstantTimeCompare([]byte(token), []byte(expectedToken)) != 1 {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "invalid deploy token"})
			return
		}

		releaseRoot := strings.TrimSpace(os.Getenv(deployReleaseRootEnv))
		if releaseRoot == "" {
			releaseRoot = defaultDeployReleaseRoot
		}

		backendBundle, _ := c.FormFile("backend_bundle")
		webBundle, _ := c.FormFile("web_bundle")
		if backendBundle == nil && webBundle == nil {
			c.JSON(http.StatusBadRequest, gin.H{"message": "backend_bundle or web_bundle is required"})
			return
		}

		if backendBundle != nil {
			targetDir := filepath.Join(releaseRoot, "bin")
			if err := os.MkdirAll(targetDir, 0o755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to prepare backend release dir"})
				return
			}
			if err := extractDeployBundle(backendBundle, targetDir, false); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "invalid backend bundle: " + err.Error()})
				return
			}
		}

		if webBundle != nil {
			targetDir := filepath.Join(releaseRoot, "web")
			if err := os.RemoveAll(targetDir); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to clear previous web release"})
				return
			}
			if err := os.MkdirAll(targetDir, 0o755); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"message": "failed to prepare web release dir"})
				return
			}
			if err := extractDeployBundle(webBundle, targetDir, false); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"message": "invalid web bundle: " + err.Error()})
				return
			}
		}

		var restartTargets []string
		if backendBundle != nil {
			restartTargets = append(restartTargets, "backend", "notification")
		}
		if webBundle != nil {
			restartTargets = append(restartTargets, "web")
		}

		restartCtx, cancel := context.WithTimeout(c.Request.Context(), 4*time.Minute)
		defer cancel()
		if err := service.restartForDeploy(restartCtx, restartTargets...); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": "deploy applied but service restart failed: " + err.Error()})
			return
		}

		c.JSON(http.StatusAccepted, gin.H{
			"message":          "deploy package accepted",
			"restarted":        restartTargets,
			"backend_updated":  backendBundle != nil,
			"frontend_updated": webBundle != nil,
			"version":          c.PostForm("version"),
		})
	})
}

func restartForDeployIDSet(ids []string) []string {
	seen := make(map[string]struct{}, len(ids))
	ordered := make([]string, 0, len(ids))
	for _, id := range ids {
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		ordered = append(ordered, id)
	}
	return ordered
}

func (s *Service) restartForDeploy(ctx context.Context, ids ...string) error {
	for _, id := range restartForDeployIDSet(ids) {
		lock, err := s.RunAction(ctx, id, ActionRestart)
		if err != nil {
			return fmt.Errorf("%s restart failed to start: %w", id, err)
		}

		if err := s.waitForDeployActionDone(ctx, lock); err != nil {
			return fmt.Errorf("%s restart timeout: %w", id, err)
		}
	}
	return nil
}

func (s *Service) waitForDeployActionDone(ctx context.Context, lock *ServiceControlLock) error {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		current := s.currentControlLock()
		if current == nil {
			return nil
		}
		if current.ServiceID != lock.ServiceID || current.Action != lock.Action || !current.StartedAt.Equal(lock.StartedAt) {
			return nil
		}

		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-ticker.C:
		}
	}
}

func extractDeployBundle(fileHeader *multipart.FileHeader, targetDir string, flattenRoot bool) error {
	if fileHeader.Size > maxDeployBundleSize {
		return fmt.Errorf("bundle too large: %d", fileHeader.Size)
	}

	file, err := fileHeader.Open()
	if err != nil {
		return err
	}
	defer file.Close()

	buffered := bufio.NewReader(file)
	stream, err := maybeGunzip(buffered)
	if err != nil {
		return err
	}

	tarReader := tar.NewReader(stream)
	var rootPrefix string
	hasFile := false

	for {
		header, err := tarReader.Next()
		if err == io.EOF {
			break
		}
		if err != nil {
			return err
		}

		name := filepath.Clean(strings.TrimSpace(header.Name))
		if name == "." || name == "" {
			continue
		}
		if strings.HasPrefix(name, "/") || strings.Contains(name, "..") {
			return fmt.Errorf("invalid entry path: %s", header.Name)
		}

		relPath := name
		if flattenRoot {
			if rootPrefix == "" {
				rootPrefix = strings.Split(name, string(os.PathSeparator))[0]
			}
			relPath = strings.TrimPrefix(name, rootPrefix)
			relPath = strings.TrimPrefix(relPath, string(os.PathSeparator))
			relPath = strings.TrimSpace(relPath)
			if relPath == "" {
				continue
			}
		}

		destPath := filepath.Join(targetDir, relPath)
		basePath := filepath.Clean(targetDir) + string(os.PathSeparator)
		cleanDest := filepath.Clean(destPath)
		if cleanDest != filepath.Clean(targetDir) && !strings.HasPrefix(cleanDest, basePath) {
			return fmt.Errorf("invalid destination path: %s", header.Name)
		}

		switch header.Typeflag {
		case tar.TypeDir:
			if err := os.MkdirAll(cleanDest, 0o755); err != nil {
				return err
			}
		case tar.TypeReg, tar.TypeRegA:
			if err := os.MkdirAll(filepath.Dir(cleanDest), 0o755); err != nil {
				return err
			}

			mode := os.FileMode(0o644)
			if header.FileInfo().Mode()&0o111 != 0 {
				mode = 0o755
			}

			output, err := os.OpenFile(cleanDest, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, mode)
			if err != nil {
				return err
			}

			if _, err := io.Copy(output, tarReader); err != nil {
				_ = output.Close()
				return err
			}

			if err := output.Close(); err != nil {
				return err
			}
			hasFile = true
		default:
			// ignore unsupported entries like symlink/devices for security
		}
	}

	if !hasFile {
		return fmt.Errorf("bundle does not contain files")
	}

	return nil
}

func maybeGunzip(reader *bufio.Reader) (io.Reader, error) {
	peek, err := reader.Peek(2)
	if err != nil && err != io.EOF {
		return nil, err
	}

	// Gzip magic number: 1f 8b
	if len(peek) == 2 && peek[0] == 0x1f && peek[1] == 0x8b {
		gzipReader, err := gzip.NewReader(reader)
		if err != nil {
			return nil, err
		}
		return gzipReader, nil
	}

	return reader, nil
}

func extractBearerToken(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return ""
	}
	parts := strings.SplitN(value, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
