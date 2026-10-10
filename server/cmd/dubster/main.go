// Program dubster runs a single (monolyth) backend service.
package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/server/cmd/dubster/config"
	"github.com/nvnazarov/dubster/server/internal/api/v1"
	"github.com/nvnazarov/dubster/server/internal/infra/mem/command"
	"github.com/nvnazarov/dubster/server/internal/infra/mem/event"
	postgresclip "github.com/nvnazarov/dubster/server/internal/infra/postgres/clip"
	postgressession "github.com/nvnazarov/dubster/server/internal/infra/postgres/session"
	"github.com/nvnazarov/dubster/server/internal/infra/s3"
	"github.com/nvnazarov/dubster/server/internal/misc/size"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/clip/verifier"
	"github.com/nvnazarov/dubster/server/internal/service/library"
	"github.com/nvnazarov/dubster/server/internal/service/session/game"
	"github.com/nvnazarov/dubster/server/internal/service/session/grader"
	"github.com/nvnazarov/dubster/server/internal/service/session/renderer"
)

func main() {
	config, err := config.Parse()
	if err != nil {
		slog.Error("init: config: parsing failed", slog.Any("error", err))
		os.Exit(1)
	}
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
		Level: func() slog.Leveler {
			switch strings.ToLower(config.LogsLevel) {
			case "error":
				return slog.LevelError
			case "warn":
				return slog.LevelWarn
			case "info":
				return slog.LevelInfo
			case "debug":
				return slog.LevelDebug
			default:
				return slog.LevelInfo
			}
		}(),
	}))
	logger.Info("init: config: parsed", slog.Any("config", config))

	pool, err := pgxpool.New(context.Background(), config.Postgres.URI())
	if err != nil {
		logger.Error("init: postgresql connections pool: failed", slog.Any("error", err))
		os.Exit(1)
	}
	postgresClipRepository := postgresclip.NewRepository(pool)
	postgresSessionRepository := postgressession.NewRepository(pool)

	s3ClipsBucket, err := s3.NewBucket(s3.Options{
		Endpoint:       config.S3.Endpoint,
		Bucket:         config.S3.ClipsBucket,
		UploadExpiry:   config.S3.ClipsUploadExpiry,
		DownloadExpiry: config.S3.ClipsDownloadExpiry,
		MaxObjectSize:  size.Size(config.Clip.MaxSize),
	})
	if err != nil {
		logger.Error("init: clips s3 bucket: failed", slog.Any("error", err))
		os.Exit(1)
	}
	s3RecordingsBucket, err := s3.NewBucket(s3.Options{
		Endpoint:      config.S3.Endpoint,
		Bucket:        config.S3.RecordingsBucket,
		UploadExpiry:  config.S3.RecordingsUploadExpiry,
		MaxObjectSize: size.Size(config.Session.MaxRecordingSize),
	})
	if err != nil {
		logger.Error("init: recordings s3 bucket: failed", slog.Any("error", err))
		os.Exit(1)
	}
	s3RendersBucket, err := s3.NewBucket(s3.Options{
		Endpoint:       config.S3.Endpoint,
		Bucket:         config.S3.RendersBucket,
		DownloadExpiry: config.S3.RendersDownloadExpiry,
	})
	if err != nil {
		logger.Error("init: renders s3 bucket: failed", slog.Any("error", err))
		os.Exit(1)
	}

	// Setup central command queue.
	const commandGrade = command.Key("grade")
	const commandRender = command.Key("render")
	const commandVerify = command.Key("verify")
	memCommandQueue := command.NewQueue(logger)

	// Setup central events queue.
	const eventGraded = event.Key("graded")
	const eventRendered = event.Key("rendered")
	const eventVerified = event.Key("verified")
	memEventsQueue := event.NewQueue(logger)

	// Setup graders - workers which grade finished sessions.
	for i := 0; i < 5; i++ {
		go func(index int) {
			grader := grader.New(grader.Options{
				Clips:      postgresClipRepository,
				Sessions:   postgresSessionRepository,
				Videos:     s3ClipsBucket,
				Recordings: s3RecordingsBucket,
				Handler:    command.Handler[string](memCommandQueue, commandGrade),
				Publisher:  event.Publisher[string](memEventsQueue, eventGraded),
				Logger:     logger,
			})
			err := grader.Run(context.Background())
			if err != nil {
				logger.Error("grader crashed", slog.Int("instance", index), slog.Any("error", err))
			}
		}(i)
	}

	// Setup renderers (workers which render finished
	// sessions).
	for i := 0; i < 5; i++ {
		go func(index int) {
			renderer := renderer.New(renderer.Options{
				Clips:      postgresClipRepository,
				Sessions:   postgresSessionRepository,
				Recordings: s3RecordingsBucket,
				Renders:    s3RendersBucket,
				Handler:    command.Handler[string](memCommandQueue, commandRender),
				Publisher:  event.Publisher[string](memEventsQueue, eventRendered),
				Logger:     logger,
			})
			err := renderer.Run(context.Background())
			if err != nil {
				logger.Error("renderer crashed", slog.Int("instance", index), slog.Any("error", err))
			}
		}(i)
	}

	// Setup verifiers (workers which verify uploaded
	// clips before they end up in the clips library.
	for i := 0; i < 5; i++ {
		go func(index int) {
			verifier := verifier.New(verifier.Options{
				Clips:           postgresClipRepository,
				Blobs:           s3ClipsBucket,
				Handler:         command.Handler[string](memCommandQueue, commandVerify),
				Publisher:       event.Publisher[verifier.Event](memEventsQueue, eventVerified),
				Logger:          logger,
				MaxClipSize:     size.Size(config.Clip.MaxSize),
				MaxClipDuration: config.Clip.MaxDuration,
				MaxClipSegments: config.Clip.MaxSegments,
				MaxClipRoles:    config.Clip.MaxRoles,
			})
			err := verifier.Run(context.Background())
			if err != nil {
				logger.Error("verifier crashed", slog.Int("instance", index), slog.Any("error", err))
			}
		}(i)
	}

	libraryImpl := library.New(postgresClipRepository)
	hubImpl := game.NewHub()

	// Setup and run HTTP API.
	err = api.ListenAndServe(config.Server.Address(), api.Routers{
		Library: api.NewLibraryRouter(libraryImpl),
		Clips: api.NewClipsRouter(api.ClipsRouterDependencies{
			CRUD: clip.NewCRUD(clip.CRUDOptions{
				Clips:           postgresClipRepository,
				Logger:          logger,
				MaxClipSegments: config.Clip.MaxSegments,
				MaxClipRoles:    config.Clip.MaxRoles,
			}),
			Store: clip.NewStore(clip.StoreOptions{
				Clips:  postgresClipRepository,
				Store:  s3ClipsBucket,
				Logger: logger,
			}),
			Verification: clip.NewVerification(clip.VerificationOptions{
				Clips:      postgresClipRepository,
				Dispatcher: command.Dispatcher[string](memCommandQueue, commandVerify),
				Logger:     logger,
			}),
			Logger: logger,
		}),
		Sessions: api.NewSessionsRouter(hubImpl),
	}, logger)
	if err != http.ErrServerClosed {
		logger.Error("server crashed", slog.Any("error", err))
		os.Exit(1)
	}
}
