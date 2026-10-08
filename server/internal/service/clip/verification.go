package clip

import (
	"context"

	"github.com/nvnazarov/dubster/server/internal/misc/command"
)

type Verification struct {
	clips      Repository
	dispatcher command.Dispatcher[string]
}

func NewVerification(clips Repository, dispatcher command.Dispatcher[string]) Verification {
	return Verification{
		clips:      clips,
		dispatcher: dispatcher,
	}
}

type VerificationParams struct {
	UserID string
	ClipID string
}

func (s *Verification) Execute(ctx context.Context, p VerificationParams) error {
	clip, err := s.clips.Get(ctx, p.ClipID)
	if err != nil {
		return err
	}
	if clip.AuthorID != p.UserID {
		return ErrNotOwned
	}
	if err := s.dispatcher.Dispatch(ctx, p.ClipID); err != nil {
		return err
	}
	return nil
}
