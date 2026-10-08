package clip

import (
	"context"
	"errors"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/util/errorsutil"
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
	clips Repository
}

func NewCRUD(clips Repository) CRUD {
	return CRUD{clips: clips}
}

type CreateParams struct {
	ClipID      string
	UserID      string
	Title       string
	Description string
	Segments    map[string]Segment
	Roles       map[string]Role
}

func (c *CRUD) Create(ctx context.Context, p CreateParams) (Clip, error) {
	clip := Clip{
		ID:          p.ClipID,
		AuthorID:    p.UserID,
		Title:       p.Title,
		Description: p.Description,
		Segments:    p.Segments,
		Roles:       p.Roles,
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
	const maxSegments = 100
	if len(clip.Segments) > maxSegments {
		return clip, ErrTooManySegments
	}
	const maxRoles = 10
	if len(clip.Roles) > maxRoles {
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
		return clip, errorsutil.WrapError(err)
	}
	return clip, nil
}

type DeleteParams struct {
	UserID string
	ClipID string
}

func (c *CRUD) Delete(ctx context.Context, p DeleteParams) error {
	tx, err := c.clips.BeginTx(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	clip, err := tx.Get(ctx, p.ClipID)
	if err != nil {
		return err
	}
	if clip.AuthorID != p.UserID {
		return ErrNotOwned
	}
	if err := tx.Delete(ctx, p.ClipID); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (c *CRUD) Get(ctx context.Context, clipID string) (Clip, error) {
	return c.clips.Get(ctx, clipID)
}
