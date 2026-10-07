package clip

import (
	"context"
)

type Get struct {
	clips Repository
}

type GetParams struct {
	ClipID string
}

func NewGet(clips Repository) Get {
	return Get{clips: clips}
}

func (s *Get) Execute(ctx context.Context, p GetParams) (Clip, error) {
	return s.clips.Get(ctx, p.ClipID)
}
