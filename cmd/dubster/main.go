package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/internal/api/v1"
	"github.com/nvnazarov/dubster/internal/infra/minio"
	"github.com/nvnazarov/dubster/internal/infra/postgres"
	"github.com/nvnazarov/dubster/internal/misc/size"
	"github.com/nvnazarov/dubster/internal/service/clip"
	"github.com/nvnazarov/dubster/internal/service/clip/verifier"
	"github.com/nvnazarov/dubster/internal/service/library"
	"github.com/nvnazarov/dubster/internal/service/session/game"
	"github.com/nvnazarov/dubster/internal/service/session/grader"
	"github.com/nvnazarov/dubster/internal/service/session/renderer"
)

func main() {
	config, err := ParseConfig()
	if err != nil {
		panic(err)
	}

	logger := log.New(os.Stdout, "dubster: ", log.Flags())

	pool, err := pgxpool.New(context.Background(), config.PostgresConnString)
	if err != nil {
		logger.Fatalf("create db connections pool: %v", err)
	}
	postgresLibrary := postgres.NewLibrary(pool)

	videos, err := minio.NewStorage(minio.Config{
		Endpoint:          "",
		Bucket:            "videos",
		MaxObjectSize:     100 * size.MB,
		UploadURLExpiry:   30 * time.Minute,
		DownloadURLExpiry: 30 * time.Minute,
	})
	if err != nil {
		logger.Fatalf("create videos storage: %v", err)
	}

	for i := 0; i < 5; i++ {
		go func() {
			grader := grader.New(grader.Dependencies{
				Clips:  postgresLibrary,
				Videos: videos,
				// TODO: add other dependencies.
			})
			err := grader.Run(context.Background())
			if err != nil {
				// TODO: handle error.
			}
		}()
	}

	for i := 0; i < 5; i++ {
		go func() {
			renderer := renderer.New(renderer.Dependencies{
				Clips: postgresLibrary,
				// TODO: add other dependencies.
			})
			err := renderer.Run(context.Background())
			if err != nil {
				// TODO: handle error.
			}
		}()
	}

	for i := 0; i < 5; i++ {
		go func() {
			verifier := verifier.New(verifier.Dependencies{
				Clips: postgresLibrary,
				Blobs: videos,
				// TODO: add other dependencies.
			})
			err := verifier.Run(context.Background())
			if err != nil {
				// TODO: handle error.
			}
		}()
	}

	clipsRouter := api.NewClipsRouter(api.ClipsRouterDependencies{
		CRUD:               clip.NewCRUD(postgresLibrary),
		GetClipUploadURL:   clip.NewGetUploadURL(postgresLibrary, videos),
		NotifyClipUploaded: clip.NotifyUploaded{},
		GetClipDownloadURL: clip.NewGetDownloadURL(videos),
	})
	libraryRouter := api.NewLibraryRouter(library.New(postgresLibrary))
	sessionsRouter := api.NewSessionsRouter(game.NewHub())

	err = api.ListenAndServe(config.ServerAddress, api.Routers{
		Library:  libraryRouter,
		Clips:    clipsRouter,
		Sessions: sessionsRouter,
	})
	if err != http.ErrServerClosed {
		logger.Fatalf("server shutdown: %v", err)
	}
}
