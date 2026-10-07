package clip

import (
	"context"
	"net/url"

	"github.com/nvnazarov/dubster/internal/misc/blob"
)

type GetUploadURL struct {
	clips   Repository
	storage blob.Uploader
}

type GetUploadURLParams struct {
	UserID string
	ClipID string
}

func NewGetUploadURL(clips Repository, storage blob.Uploader) GetUploadURL {
	return GetUploadURL{clips: clips, storage: storage}
}

func (s *GetUploadURL) Execute(ctx context.Context, p GetUploadURLParams) (url.URL, error) {
	clip, err := s.clips.Get(ctx, p.ClipID)
	if err != nil {
		return url.URL{}, err
	}
	if clip.AuthorID != p.UserID {
		return url.URL{}, ErrNotOwned
	}
	return s.storage.UploadURL(ctx, p.ClipID)
}
