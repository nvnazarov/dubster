package clip

import (
	"context"
	"net/url"

	"github.com/nvnazarov/dubster/internal/blob"
)

type GetDownloadURL struct {
	storage blob.Downloader
}

func NewGetDownloadURL(storage blob.Downloader) GetDownloadURL {
	return GetDownloadURL{storage: storage}
}

func (s *GetDownloadURL) Execute(ctx context.Context, clipID string) (url.URL, error) {
	return s.storage.DownloadURL(ctx, clipID)
}
