// Program dubster runs a single (monolyth) backend service.
package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/server/cmd/dubster/config"
	"github.com/nvnazarov/dubster/server/internal/api/v1"
	"github.com/nvnazarov/dubster/server/internal/infra/mem/command"
	"github.com/nvnazarov/dubster/server/internal/infra/mem/event"
	"github.com/nvnazarov/dubster/server/internal/infra/postgres"
	"github.com/nvnazarov/dubster/server/internal/infra/s3"
	"github.com/nvnazarov/dubster/server/internal/misc/size"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/clip/verifier"
	"github.com/nvnazarov/dubster/server/internal/service/library"
	"github.com/nvnazarov/dubster/server/internal/service/session"
	"github.com/nvnazarov/dubster/server/internal/service/session/game"
	"github.com/nvnazarov/dubster/server/internal/service/session/grader"
	"github.com/nvnazarov/dubster/server/internal/service/session/renderer"
)

func main() {
	logger := log.New(os.Stdout, "dubster: ", log.Flags())

	config, err := config.Parse()
	if err != nil {
		panic(err)
	}
	logger.Printf("config: %+v\n", config)

	pool, err := pgxpool.New(context.Background(), config.Postgres.URI())
	if err != nil {
		logger.Fatalf("create db connections pool: %v", err)
	}
	postgresLibrary := postgres.NewLibrary(pool)

	videos, err := s3.NewStorage(s3.Config{
		Endpoint:          config.S3.Endpoint,
		Bucket:            "videos",
		MaxObjectSize:     size.Size(config.Clip.MaxSize),
		UploadURLExpiry:   config.S3.UploadURLExpiry,
		DownloadURLExpiry: config.S3.DownloadURLExpiry,
	})
	if err != nil {
		logger.Fatalf("create videos storage: %v", err)
	}

	// Setup a central commands and events queues.
	const commandGrade = command.Key("grade")
	const commandRender = command.Key("render")
	const commandVerify = command.Key("verify")
	commandQueue := command.NewQueue(logger)

	const eventGraded = event.Key("graded")
	const eventRendered = event.Key("rendered")
	const eventVerified = event.Key("verified")
	eventsQueue := event.NewQueue(logger)

	// Setup graders - workers which grade finished sessions.
	for i := 0; i < 5; i++ {
		go func(index int) {
			grader := grader.New(grader.Dependencies{
				Clips:      postgresLibrary,
				Videos:     videos,
				Recordings: nil,
				Sessions:   nil,
				Handler:    command.Handler[session.SessionID](commandQueue, commandGrade),
				Publisher:  event.Publisher[session.SessionID](eventsQueue, eventGraded),
			})
			err := grader.Run(context.Background())
			if err != nil {
				logger.Printf("grader[%d]: crashed: %v", index, err)
			}
		}(i)
	}

	// Setup renderers - workers which render finished sessions.
	for i := 0; i < 5; i++ {
		go func(index int) {
			renderer := renderer.New(renderer.Dependencies{
				Clips:      postgresLibrary,
				Sessions:   nil,
				Recordings: nil,
				Renders:    nil,
				Handler:    command.Handler[session.SessionID](commandQueue, commandRender),
				Publisher:  event.Publisher[session.SessionID](eventsQueue, eventRendered),
			})
			err := renderer.Run(context.Background())
			if err != nil {
				logger.Printf("renderer[%d]: crashed: %v", index, err)
			}
		}(i)
	}

	// Setup verifiers - workers which verify uploaded clips
	// before they end up in the clips library.
	for i := 0; i < 5; i++ {
		go func(index int) {
			verifier := verifier.New(verifier.Dependencies{
				Clips:     postgresLibrary,
				Blobs:     videos,
				Handler:   command.Handler[string](commandQueue, commandVerify),
				Publisher: event.Publisher[verifier.Event](eventsQueue, eventVerified),
			})
			err := verifier.Run(context.Background())
			if err != nil {
				logger.Printf("verifier[%d]: crashed: %v", index, err)
			}
		}(i)
	}

	// Setup and run HTTP API.
	clipsRouter := api.NewClipsRouter(api.ClipsRouterDependencies{
		CRUD:         clip.NewCRUD(postgresLibrary),
		Store:        clip.NewStore(videos, postgresLibrary),
		Verification: clip.NewVerification(postgresLibrary, nil),
	})
	libraryRouter := api.NewLibraryRouter(library.New(postgresLibrary))
	sessionsRouter := api.NewSessionsRouter(game.NewHub())
	err = api.ListenAndServe(config.Server.Address(), api.Routers{
		Library:  libraryRouter,
		Clips:    clipsRouter,
		Sessions: sessionsRouter,
	}, logger)
	if err != http.ErrServerClosed {
		logger.Printf("server shutdown: %v", err)
	}
}
