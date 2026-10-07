package clip

import (
	"context"
)

type Delete struct {
	clips Repository
}

type DeleteParams struct {
	UserID string
	ClipID string
}

func NewDelete(clips Repository) Delete {
	return Delete{clips: clips}
}

func (s *Delete) Execute(ctx context.Context, p DeleteParams) error {
	tx, err := s.clips.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	clip, err := tx.Get(ctx, p.ClipID)
	if err != nil {
		return err
	}
	if clip.AuthorID != p.UserID {
		return ErrNotOwned
	}
	if err := tx.Delete(ctx, p.ClipID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}
