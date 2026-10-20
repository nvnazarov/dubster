package clip

import (
	"context"
	"errors"
	"fmt"
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

type StoreOptions struct {
	Clips Repository
	Store interface {
		blob.Uploader
		blob.Downloader
	}
}

func NewStore(o StoreOptions) *Store {
	return &Store{
		store: o.Store,
		clips: o.Clips,
	}
}

type StoreUploadURLParams struct {
	UserID string
	ClipID string
}

func (s *Store) UploadURL(ctx context.Context, p StoreUploadURLParams) (*url.URL, error) {
	tx, err := s.clips.BeginTx(ctx)
	if err != nil {
		return nil, fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	clip, err := tx.Get(ctx, p.ClipID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, err
		}
		return nil, fmt.Errorf("get clip \"%s\": %w", p.ClipID, err)
	}
	if clip.AuthorID != p.UserID {
		return nil, ErrNotOwned
	}
	if clip.Verified {
		clip.Verified = false
		if err := s.clips.Save(ctx, clip); err != nil {
			return nil, fmt.Errorf("save clip \"%s\" not verified: %w", p.ClipID, err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("commit transaction: %w", err)
	}
	url, err := s.store.UploadURL(ctx, p.ClipID)
	if err != nil {
		return nil, fmt.Errorf("generate upload url for clip \"%w\": %w", p.ClipID, err)
	}
	return url, nil
}

func (s *Store) DownloadURL(ctx context.Context, clipID string) (*url.URL, error) {
	_, err := s.clips.Get(ctx, clipID)
	if err != nil {
		if errors.Is(err, ErrNotFound) {
			return nil, err
		}
		return nil, fmt.Errorf("get clip \"%s\": %w", clipID, err)
	}
	url, err := s.store.DownloadURL(ctx, clipID)
	if err != nil {
		return nil, fmt.Errorf("generate download url for clip \"%s\": %w", clipID, err)
	}
	return url, nil
}
