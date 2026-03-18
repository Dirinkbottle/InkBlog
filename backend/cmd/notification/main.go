package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"inkblog-backend/internal/bootstrap"
	"inkblog-backend/internal/database"
	"inkblog-backend/internal/notification"
	"inkblog-backend/pkg/utils"
)

func main() {
	if err := utils.InitLogger("./logs/notification.log"); err != nil {
		log.Printf("Warning: Failed to initialize logger: %v", err)
	}
	defer utils.CloseLogger()

	if _, err := os.Stat("install.lock"); os.IsNotExist(err) {
		log.Fatal("notification service requires installed application")
	}

	appConfig, err := bootstrap.LoadInstalledAppConfig("config.json")
	if err != nil {
		log.Fatal(err)
	}

	if err := bootstrap.ApplyRuntimeConfig(appConfig); err != nil {
		log.Fatal(err)
	}

	if err := bootstrap.InitDatabaseFromAppConfig(appConfig); err != nil {
		log.Fatal(err)
	}

	settings := notification.LoadSettings()
	service := notification.NewService(database.GetDB(), settings)
	router := notification.SetupRouter(service)

	expiryCtx, cancelExpiry := context.WithCancel(context.Background())
	defer cancelExpiry()
	go runExpiryWorker(expiryCtx, service)

	addr := fmt.Sprintf(":%s", settings.Port)
	utils.Info("[Notification] service listening on %s", addr)

	srv := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	cancelExpiry()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		utils.Error("[Notification] forced shutdown: %v", err)
	}
}

func runExpiryWorker(ctx context.Context, service *notification.Service) {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if err := service.ExpireDeliveries(); err != nil {
				utils.Warn("[Notification] expire deliveries failed: %v", err)
			}
		}
	}
}
