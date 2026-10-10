package renderer

import (
	"context"
	"io"
	"log/slog"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
	"github.com/nvnazarov/dubster/server/internal/misc/command"
	"github.com/nvnazarov/dubster/server/internal/misc/event"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type Renderer struct {
	sessions   session.Repository
	clips      clip.Repository
	recordings blob.OpenReader
	renders    blob.OpenWriter
	handler    command.Handler[string]
	publisher  event.Publisher[string]
	logger     *slog.Logger
}

type Options struct {
	Sessions   session.Repository
	Clips      clip.Repository
	Recordings blob.OpenReader
	Renders    blob.OpenWriter
	Handler    command.Handler[string]
	Publisher  event.Publisher[string]
	Logger     *slog.Logger
}

func New(o Options) Renderer {
	return Renderer{
		sessions:   o.Sessions,
		clips:      o.Clips,
		recordings: o.Recordings,
		renders:    o.Renders,
		handler:    o.Handler,
		publisher:  o.Publisher,
		logger:     o.Logger,
	}
}

func (r *Renderer) Run(ctx context.Context) error {
	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}
		cmd, err := r.handler.Handle(ctx)
		if err != nil {
			// TODO: log error, retry, etc.
			continue
		}
		r.handle(ctx, cmd)
	}
}

func (r *Renderer) handle(ctx context.Context, cmd command.Command[string]) {
	defer func() {
		if err := cmd.Rollback(ctx); err != nil {
			// TODO: log error.
		}
	}()
	sessionID := cmd.Data()
	if err := r.render(ctx, sessionID); err != nil {
		// TODO: log error.
		return
	}
	if err := r.publisher.Publish(ctx, sessionID); err != nil {
		// TODO: log error.
		return
	}
	if err := cmd.Commit(ctx); err != nil {
		// TODO: log error.
	}
}

func (r *Renderer) render(ctx context.Context, sessionID string) error {
	session, err := r.sessions.Get(ctx, sessionID)
	if err != nil {
		return err
	}
	if session.Rendered {
		return nil
	}
	clip, err := r.clips.Get(ctx, session.ClipID)
	if err != nil {
		return err
	}
	for segmentID := range clip.Segments {
		reader, err := r.recordings.OpenRead(ctx, segmentID)
		if err != nil {
			return err
		}
		defer reader.Close()
		_, err = io.ReadAll(reader)
		if err != nil {
			return err
		}
		// TODO: add recording to the mp4 file.

	}
	w, err := r.renders.OpenWrite(ctx, string(sessionID))
	if err != nil {
		return err
	}
	defer w.Close()
	_, err = w.Write([]byte("hello"))
	session.Rendered = true
	session.DateRendered = time.Now()
	r.sessions.SaveRendered(ctx, session)
	return err
}
