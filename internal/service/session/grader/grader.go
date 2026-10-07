package grader

import (
	"context"
	"errors"
	"time"

	"github.com/nvnazarov/dubster/internal/misc/blob"
	"github.com/nvnazarov/dubster/internal/misc/command"
	"github.com/nvnazarov/dubster/internal/misc/event"
	"github.com/nvnazarov/dubster/internal/service/clip"
	"github.com/nvnazarov/dubster/internal/service/session"
)

type Grader struct {
	clips      clip.Repository
	sessions   session.Repository
	recordings blob.OpenReader
	videos     blob.OpenReader
	handler    command.Handler[session.SessionID]
	publisher  event.Publisher[session.SessionID]
}

type Dependencies struct {
	Clips      clip.Repository
	Sessions   session.Repository
	Recordings blob.OpenReader
	Videos     blob.OpenReader
	Handler    command.Handler[session.SessionID]
	Publisher  event.Publisher[session.SessionID]
}

func New(d Dependencies) Grader {
	return Grader{
		clips:      d.Clips,
		sessions:   d.Sessions,
		videos:     d.Videos,
		recordings: d.Recordings,
		handler:    d.Handler,
		publisher:  d.Publisher,
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

func (g *Grader) handle(ctx context.Context, cmd command.Command[session.SessionID]) {
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

func (g *Grader) grade(ctx context.Context, sessionID session.SessionID) error {
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
