package clip

import (
	"context"
	"errors"
	"time"

	"github.com/nvnazarov/dubster/internal/util/errorsutil"
)

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

type Create struct {
	clips Repository
}

type CreateParams struct {
	UserID      string
	ClipID      string
	Title       string
	Description string
	Segments    map[string]Segment
	Roles       map[string]Role
}

func NewCreate(clips Repository) Create {
	return Create{clips: clips}
}

func (s *Create) Execute(ctx context.Context, p CreateParams) (Clip, error) {
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
	err := s.clips.Save(ctx, clip)
	if err != nil {
		return clip, errorsutil.WrapError(err)
	}
	return clip, nil
}
