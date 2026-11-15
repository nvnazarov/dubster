package verifier

import (
	"context"
	"errors"
	"fmt"

	"github.com/nvnazarov/dubster/server/internal/domain/model/verification"
	"github.com/nvnazarov/dubster/server/internal/domain/service/clip"
	"github.com/nvnazarov/dubster/server/internal/misc/blob/v2"
)

var ErrClipNotFound = errors.New("clip not found")

// Verifier verifies that the clip is valid. This is a
// crucial step before the clip ends up in the library.
type Verifier struct {
	clips  clip.Repository
	videos blob.RemoteFolder
}

func New(clips clip.Repository, videos blob.RemoteFolder) *Verifier {
	return &Verifier{
		clips:  clips,
		videos: videos,
	}
}

func (v *Verifier) Verify(ctx context.Context, clipID string) (verification.Status, error) {
	c, err := v.clips.Find(ctx, clipID)
	if err != nil {
		return 0, fmt.Errorf("find clip: %w", err)
	}
	if c == nil {
		return 0, ErrClipNotFound
	}
	video := v.videos.File(clipID)
	return clip.Verify(ctx, *c, video)
}
