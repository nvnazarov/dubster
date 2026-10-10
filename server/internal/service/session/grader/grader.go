package grader

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
	"github.com/nvnazarov/dubster/server/internal/misc/command"
	"github.com/nvnazarov/dubster/server/internal/misc/event"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type Grader struct {
	clips      clip.Repository
	sessions   session.Repository
	recordings blob.OpenReader
	videos     blob.OpenReader
	handler    command.Handler[string]
	publisher  event.Publisher[string]
	logger     *slog.Logger
}

type Options struct {
	Clips      clip.Repository
	Sessions   session.Repository
	Recordings blob.OpenReader
	Videos     blob.OpenReader
	Handler    command.Handler[string]
	Publisher  event.Publisher[string]
	Logger     *slog.Logger
}

func New(o Options) Grader {
	return Grader{
		clips:      o.Clips,
		sessions:   o.Sessions,
		videos:     o.Videos,
		recordings: o.Recordings,
		handler:    o.Handler,
		publisher:  o.Publisher,
		logger:     o.Logger,
	}
}

func (g *Grader) Run(ctx context.Context) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		cmd, err := g.handler.Handle(ctx)
		if err != nil {
			// TODO: log error.
			continue
		}
		g.handle(ctx, cmd)
	}
}

func (g *Grader) handle(ctx context.Context, cmd command.Command[string]) {
	defer func() {
		if err := cmd.Rollback(ctx); err != nil {
			// TODO: log error.
		}
	}()
	sessionID := cmd.Data()
	if err := g.grade(ctx, sessionID); err != nil {
		// TODO: log error.
		return
	}
	if err := g.publisher.Publish(ctx, sessionID); err != nil {
		// TODO: log error.
		return
	}
	if err := cmd.Commit(ctx); err != nil {
		// TODO: log error.
	}
}

func (g *Grader) grade(ctx context.Context, sessionID string) error {
	session, err := g.sessions.Get(ctx, sessionID)
	if err != nil {
		return err
	}
	clip, err := g.clips.Get(ctx, session.ClipID)
	if err != nil {
		return err
	}
	grades := make(map[string]float64)
	for userID := range session.Participants {
		grades[userID] = 0
	}
	for _, segment := range clip.Segments {
		_, err := g.recordings.OpenRead(ctx, segment.ID)
		if err != nil {
			if errors.Is(err, blob.ErrNotFound) {
				continue
			}
			return err
		}
		// TODO: calc score.
	}
	session.Grades = grades
	session.DateGraded = time.Now()
	return g.sessions.SaveGraded(ctx, session)
}
