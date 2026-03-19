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
	"inkblog-backend/internal/corecontrol"
	"inkblog-backend/pkg/utils"
)

func main() {
	if err := utils.InitLogger("./logs/core-control.log"); err != nil {
		log.Printf("Warning: Failed to initialize logger: %v", err)
	}
	defer utils.CloseLogger()

	if _, err := os.Stat("install.lock"); os.IsNotExist(err) {
		log.Fatal("core-control service requires installed application")
	}

	appConfig, err := bootstrap.LoadInstalledAppConfig("config.json")
	if err != nil {
		log.Fatal(err)
	}

	if err := bootstrap.ApplyRuntimeConfig(appConfig); err != nil {
		log.Fatal(err)
	}

	settings := corecontrol.LoadSettings()
	service, err := corecontrol.NewService(settings)
	if err != nil {
		log.Fatal(err)
	}

	router := corecontrol.SetupRouter(service)
	addr := fmt.Sprintf(":%s", settings.Port)
	utils.Info("[CoreControl] service listening on %s", addr)

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

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		utils.Error("[CoreControl] forced shutdown: %v", err)
	}
}
