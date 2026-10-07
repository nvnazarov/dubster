package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/internal/api/v1"
	"github.com/nvnazarov/dubster/internal/impl/minio"
	"github.com/nvnazarov/dubster/internal/impl/postgres"
	"github.com/nvnazarov/dubster/internal/service/clip"
	"github.com/nvnazarov/dubster/internal/service/library"
	"github.com/nvnazarov/dubster/internal/service/session/game"
	"github.com/nvnazarov/dubster/internal/service/session/grader"
	"github.com/nvnazarov/dubster/internal/util/size"
)

func main() {
	const connString = ""
	const address = ":8080"

	logger := log.New(os.Stdout, "dubster: ", log.Flags())

	pool, err := pgxpool.New(context.Background(), connString)
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
			})
			err := grader.Run(context.Background())
			if err != nil {
				// TODO: handle error.
			}
		}()
	}

	clipsRouter := api.NewClipsRouter(api.ClipsRouterDependencies{
		DeleteClip:         clip.NewDelete(postgresLibrary),
		CreateClip:         clip.NewCreate(postgresLibrary),
		GetClip:            clip.NewGet(postgresLibrary),
		GetClipUploadURL:   clip.NewGetUploadURL(postgresLibrary, videos),
		NotifyClipUploaded: clip.NotifyUploaded{},
		GetClipDownloadURL: clip.NewGetDownloadURL(videos),
	})
	libraryRouter := api.NewLibraryRouter(library.New(postgresLibrary))
	sessionsRouter := api.NewSessionsRouter(game.NewHub())

	err = api.ListenAndServe(address, api.Routers{
		Library:  libraryRouter,
		Clips:    clipsRouter,
		Sessions: sessionsRouter,
	})
	if err != http.ErrServerClosed {
		logger.Fatalf("server shutdown: %v", err)
	}
}
