package clip

import (
	"context"

	"github.com/nvnazarov/dubster/server/internal/domain/model/clip"
)

type Repository interface {
	// Find returns a [clip.Clip] by ID.
	//
	// Find returns (nil, nil) if the clip does not exist.
	Find(ctx context.Context, id string) (*clip.Clip, error)

	Delete(ctx context.Context, id string) error

	// Create creates a new [clip.Clip].
	//
	// Create returns an error if the clip already exists.
	Create(ctx context.Context, clip clip.Clip) error

	CreateOrUpdate(ctx context.Context, clip clip.Clip) error
}
