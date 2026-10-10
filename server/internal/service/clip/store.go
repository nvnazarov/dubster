package clip

import (
	"context"
	"log/slog"
	"net/url"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
)

type Store struct {
	clips Repository
	store interface {
		blob.Uploader
		blob.Downloader
	}
	logger *slog.Logger
}

type StoreOptions struct {
	Clips Repository
	Store interface {
		blob.Uploader
		blob.Downloader
	}
	Logger *slog.Logger
}

func NewStore(o StoreOptions) *Store {
	return &Store{
		store:  o.Store,
		clips:  o.Clips,
		logger: o.Logger,
	}
}

type StoreUploadURLParams struct {
	UserID string
	ClipID string
}

func (s *Store) UploadURL(ctx context.Context, p StoreUploadURLParams) (url *url.URL, err error) {
	defer func() {
		if err != nil {
			s.logger.Error("clip store: failed to create upload url", slog.Any("error", err))
		}
	}()
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

func (s *Store) DownloadURL(ctx context.Context, clipID string) (url *url.URL, err error) {
	defer func() {
		if err != nil {
			s.logger.Error("clip store: failed to create download url", slog.Any("error", err))
		}
	}()
	_, err = s.clips.Get(ctx, clipID)
	if err != nil {
		return nil, err
	}
	return s.store.DownloadURL(ctx, clipID)
}
