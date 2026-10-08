package clip

import (
	"context"
	"net/url"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
)

type Store struct {
	clips Repository
	store interface {
		blob.Uploader
		blob.Downloader
	}
}

func NewStore(store interface {
	blob.Uploader
	blob.Downloader
}, clips Repository) Store {
	return Store{
		store: store,
		clips: clips,
	}
}

type StoreUploadURLParams struct {
	UserID string
	ClipID string
}

func (s *Store) UploadURL(ctx context.Context, p StoreUploadURLParams) (*url.URL, error) {
	tx, err := s.clips.BeginTx(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)
	clip, err := tx.Get(ctx, p.ClipID)
	if err != nil {
		return nil, err
	}
	if clip.AuthorID != p.UserID {
		return nil, ErrNotOwned
	}
	if clip.Verified {
		clip.Verified = false
		if err := s.clips.Save(ctx, clip); err != nil {
			return nil, err
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return s.store.UploadURL(ctx, p.ClipID)
}

func (s *Store) DownloadURL(ctx context.Context, clipID string) (*url.URL, error) {
	_, err := s.clips.Get(ctx, clipID)
	if err != nil {
		return nil, err
	}
	return s.store.DownloadURL(ctx, clipID)
}
