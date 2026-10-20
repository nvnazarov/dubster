package clip

import (
	"context"
	"errors"
	"fmt"
	"time"
	"uuid"
)

type InvalidParams error

var (
	ErrEmptyTitle         InvalidParams = errors.New("title is empty")
	ErrTitleTooLong       InvalidParams = errors.New("title is too long")
	ErrDescriptionTooLong InvalidParams = errors.New("description is too long")
	ErrUnusedRole         InvalidParams = errors.New("role is unused")
	ErrUnknownRole        InvalidParams = errors.New("role is unknown")
	ErrTooManyRoles       InvalidParams = errors.New("too many roles")
	ErrTooManySegments    InvalidParams = errors.New("too many segments")
	ErrNoSegments         InvalidParams = errors.New("no segments")
	ErrFormat             InvalidParams = errors.New("invalid format")
)

type CRUD struct {
	clips           Repository
	maxClipRoles    int
	maxClipSegments int
}

type CRUDOptions struct {
	Clips           Repository
	MaxClipRoles    int
	MaxClipSegments int
}

func NewCRUD(o CRUDOptions) *CRUD {
	return &CRUD{
		clips:           o.Clips,
		maxClipRoles:    o.MaxClipRoles,
		maxClipSegments: o.MaxClipSegments,
	}
}

type CreateParams struct {
	UserID      string
	Title       string
	Description string
	Segments    map[string]Segment
	Roles       map[string]Role
}

func (c *CRUD) Create(ctx context.Context, p CreateParams) (Clip, error) {
	clip := Clip{
		ID:          uuid.New().String(),
		AuthorID:    p.UserID,
		Title:       p.Title,
		Description: p.Description,
		Segments:    p.Segments,
		Roles:       p.Roles,
		Rating:      0,
		Verified:    false,
		DateCreated: time.Now(),
	}
	if clip.Title == "" {
		return clip, ErrEmptyTitle
	}
	const maxTitleLength = 128
	if len(clip.Title) > maxTitleLength {
		return clip, ErrTitleTooLong
	}
	const maxDescriptionLength = 1024
	if len(clip.Description) > maxDescriptionLength {
		return clip, ErrDescriptionTooLong
	}
	if len(clip.Segments) == 0 {
		return clip, ErrNoSegments
	}
	if len(clip.Segments) > c.maxClipSegments {
		return clip, ErrTooManySegments
	}
	if len(clip.Roles) > c.maxClipRoles {
		return clip, ErrTooManyRoles
	}
	for id, role := range clip.Roles {
		if role.ID != id {
			return clip, ErrFormat
		}
	}
	for id, segment := range clip.Segments {
		if segment.ID != id {
			return clip, ErrFormat
		}
		if _, ok := clip.Roles[segment.RoleID]; !ok {
			return clip, ErrUnknownRole
		}
	}
	err := c.clips.Save(ctx, clip)
	if err != nil {
		return clip, fmt.Errorf("save clip: %w", err)
	}
	return clip, nil
}

type DeleteParams struct {
	UserID string
	ClipID string
}

func (c *CRUD) Delete(ctx context.Context, p DeleteParams) (err error) {
	tx, err := c.clips.BeginTx(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)
	clip, err := tx.Get(ctx, p.ClipID)
	if err != nil {
		return fmt.Errorf("get clip \"%s\": %w", p.ClipID, err)
	}
	if clip.AuthorID != p.UserID {
		return ErrNotOwned
	}
	if err := tx.Delete(ctx, p.ClipID); err != nil {
		return fmt.Errorf("delete clip \"%s\": %w", p.ClipID, err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}
	return nil
}

func (c *CRUD) Get(ctx context.Context, clipID string) (Clip, error) {
	clip, err := c.clips.Get(ctx, clipID)
	if err != nil {
		return clip, fmt.Errorf("get clip \"%s\": %w", clipID, err)
	}
	return clip, nil
}
