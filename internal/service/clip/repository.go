package clip

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("clip not found")

type Tx interface {
	Get(ctx context.Context, clipID string) (Clip, error)
	Delete(ctx context.Context, clipID string) error
	Save(ctx context.Context, clip Clip) error
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}

type Repository interface {
	Get(ctx context.Context, clipID string) (Clip, error)
	Delete(ctx context.Context, clipID string) error
	Save(ctx context.Context, clip Clip) error
	BeginTx(ctx context.Context) (Tx, error)
}
