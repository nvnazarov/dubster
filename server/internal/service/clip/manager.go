package clip

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"

	model "github.com/nvnazarov/dubster/server/internal/domain/model/clip"
	"github.com/nvnazarov/dubster/server/internal/domain/service/clip"
	"github.com/nvnazarov/dubster/server/internal/misc/blob"
)

const (
	DefaultUploadExpiry   = 30 * time.Minute
	DefaultDownloadExpiry = 30 * time.Minute
)

var (
	ErrClipNotOwned = errors.New("clip not owned")
	ErrClipNotFound = errors.New("clip not found")
)

type Option func(m *Manager)

type Manager struct {
	clips          Repository
	videos         blob.RemoteFolder
	uploadExpiry   time.Duration
	downloadExpiry time.Duration
}

func NewManager(clips Repository, videos blob.RemoteFolder, options ...Option) *Manager {
	m := &Manager{
		clips:          clips,
		videos:         videos,
		uploadExpiry:   DefaultUploadExpiry,
		downloadExpiry: DefaultDownloadExpiry,
	}
	for _, opt := range options {
		opt(m)
	}
	return m
}

type CreateParams struct {
	UserID      string
	Title       string
	Description string
	Segments    map[string]model.Segment
	Roles       map[string]model.Role
}

func (m *Manager) Create(ctx context.Context, p CreateParams) (*model.Clip, error) {
	c, err := clip.Create(clip.CreateOptions{
		AuthorID:    p.UserID,
		Title:       p.Title,
		Description: p.Description,
		Segments:    p.Segments,
		Roles:       p.Roles,
	})
	if err != nil {
		return nil, err
	}
	err = m.clips.Create(ctx, *c)
	if err != nil {
		return c, fmt.Errorf("create clip: %w", err)
	}
	return c, nil
}

type DeleteParams struct {
	UserID string
	ClipID string
}

func (m *Manager) Delete(ctx context.Context, p DeleteParams) error {
	clip, err := m.clips.Find(ctx, p.ClipID)
	if err != nil {
		return err
	}
	if clip == nil {
		return ErrClipNotFound
	}
	if clip.AuthorID != p.UserID {
		return ErrClipNotOwned
	}
	return m.clips.Delete(ctx, p.ClipID)
}

type FindParams struct {
	UserID string
	ClipID string
}

func (m *Manager) Find(ctx context.Context, p FindParams) (*model.Clip, error) {
	clip, err := m.clips.Find(ctx, p.ClipID)
	if err != nil {
		return clip, fmt.Errorf("find clip: %w", err)
	}
	if clip == nil {
		return nil, ErrClipNotFound
	}
	if clip.AuthorID != p.UserID {
		return nil, ErrClipNotOwned
	}
	return clip, nil
}

type UploadULRParams struct {
	UserID string
	ClipID string
}

func (m *Manager) UploadURL(ctx context.Context, p UploadULRParams) (*url.URL, error) {
	clip, err := m.clips.Find(ctx, p.ClipID)
	if err != nil {
		return nil, fmt.Errorf("find clip: %w", err)
	}
	if clip == nil {
		return nil, ErrClipNotFound
	}
	if clip.AuthorID != p.UserID {
		return nil, ErrClipNotOwned
	}
	return m.videos.File(p.ClipID).UploadURL(ctx, m.uploadExpiry)
}

type DownladULRParams struct {
	UserID string
	ClipID string
}

func (m *Manager) DownloadURL(ctx context.Context, p DownladULRParams) (*url.URL, error) {
	clip, err := m.clips.Find(ctx, p.ClipID)
	if err != nil {
		return nil, fmt.Errorf("find clip: %w", err)
	}
	if clip == nil {
		return nil, ErrClipNotFound
	}
	if clip.AuthorID != p.UserID {
		return nil, ErrClipNotOwned
	}
	return m.videos.File(p.ClipID).DownloadURL(ctx, m.downloadExpiry)
}
