package verifier

import (
	"bytes"
	"context"
	"errors"
	"io"
	"time"

	"github.com/abema/go-mp4"
	"github.com/nvnazarov/dubster/server/internal/misc/blob"
	"github.com/nvnazarov/dubster/server/internal/misc/command"
	"github.com/nvnazarov/dubster/server/internal/misc/event"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
)

type VerificationError error

var (
	ErrTooBig          VerificationError = errors.New("file is too big")
	ErrNotAVideo       VerificationError = errors.New("file is not a video")
	ErrTooLong         VerificationError = errors.New("clip is too long")
	ErrUnusedRole      VerificationError = errors.New("unused role")
	ErrUnknownRole     VerificationError = errors.New("unknow role")
	ErrTooManySegments VerificationError = errors.New("too many segments")
	ErrTooManyRoles    VerificationError = errors.New("too many roles")
	ErrNoSegments      VerificationError = errors.New("no segments")
	ErrEmptyTitle      VerificationError = errors.New("empty title")
)

const (
	MaxSizeBytes = 200 << 20
	MaxDuration  = 2 * time.Minute
	MaxSegments  = 100
	MaxRoles     = 20
)

type Verifier struct {
	blobs     blob.OpenReader
	clips     clip.Repository
	handler   command.Handler[string]
	publisher event.Publisher[Event]
}

type Event struct {
	ClipID       string
	Verified     bool
	DateVerified time.Time
}

type Dependencies struct {
	Blobs   blob.OpenReader
	Clips   clip.Repository
	Handler command.Handler[string]
}

func New(d Dependencies) Verifier {
	return Verifier{
		blobs:   d.Blobs,
		clips:   d.Clips,
		handler: d.Handler,
	}
}

func (r *Verifier) Run(ctx context.Context) error {
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

func (r *Verifier) handle(ctx context.Context, cmd command.Command[string]) {
	defer func() {
		if err := cmd.Rollback(ctx); err != nil {
			// TODO: log error.
		}
	}()
	clipID := cmd.Data()
	clip, err := r.clips.Get(ctx, clipID)
	if err != nil {
		// TODO: log error.
		return
	}
	if err := r.verify(ctx, clip); err != nil {
		if _, ok := errors.AsType[VerificationError](err); !ok {
			// TODO: log error.
			return
		}
	}
	clip.Verified = (err == nil)
	clip.DateVerified = time.Now()
	if err := r.clips.Save(ctx, clip); err != nil {
		// TODO: log error.
		return
	}
	if err := r.publisher.Publish(ctx, Event{
		ClipID:       clipID,
		Verified:     clip.Verified,
		DateVerified: clip.DateVerified,
	}); err != nil {
		// TODO: log error.
		return
	}
	if err := cmd.Commit(ctx); err != nil {
		// TODO: log error.
	}
}

func (r *Verifier) verify(ctx context.Context, clip clip.Clip) error {
	if clip.Verified {
		return nil
	}
	if clip.Title == "" {
		return ErrEmptyTitle
	}
	if len(clip.Segments) == 0 {
		return ErrNoSegments
	}
	if len(clip.Segments) > MaxSegments {
		return ErrTooManySegments
	}
	if len(clip.Roles) > MaxRoles {
		return ErrTooManyRoles
	}
	roles := make(map[string]struct{})
	for _, segment := range clip.Segments {
		if _, ok := clip.Roles[segment.RoleID]; !ok {
			return ErrUnknownRole
		}
		roles[segment.RoleID] = struct{}{}
	}
	if len(roles) < len(clip.Roles) {
		return ErrUnusedRole
	}
	blob, err := r.blobs.OpenRead(ctx, clip.ID)
	if err != nil {
		return err
	}
	defer blob.Close()
	blobBytes, err := io.ReadAll(io.LimitReader(blob, MaxSizeBytes+1))
	if err != nil {
		return err
	}
	probeInfo, err := mp4.Probe(bytes.NewReader(blobBytes))
	if err != nil {
		return ErrNotAVideo
	}
	switch {
	case len(blobBytes) > MaxSizeBytes:
		return ErrTooBig
	case time.Duration(probeInfo.Duration*1e6) > MaxDuration:
		return ErrTooLong
	}
	return nil
}
