package clip

import (
	"context"
	"log/slog"

	"github.com/nvnazarov/dubster/server/internal/misc/command"
)

type Verification struct {
	clips      Repository
	dispatcher command.Dispatcher[string]
	logger     *slog.Logger
}

type VerificationOptions struct {
	Clips      Repository
	Dispatcher command.Dispatcher[string]
	Logger     *slog.Logger
}

func NewVerification(o VerificationOptions) *Verification {
	return &Verification{
		clips:      o.Clips,
		dispatcher: o.Dispatcher,
		logger:     o.Logger,
	}
}

type VerificationParams struct {
	UserID string
	ClipID string
}

func (s *Verification) Execute(ctx context.Context, p VerificationParams) error {
	clip, err := s.clips.Get(ctx, p.ClipID)
	if err != nil {
		s.logger.Error("verification: failed to get clip", slog.Any("error", err))
		return err
	}
	if clip.AuthorID != p.UserID {
		return ErrNotOwned
	}
	if err := s.dispatcher.Dispatch(ctx, p.ClipID); err != nil {
		s.logger.Error("verification: failed to dispatch command", slog.Any("error", err))
		return err
	}
	return nil
}
