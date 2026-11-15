package clip

import (
	"time"
	"uuid"

	"github.com/nvnazarov/dubster/server/internal/domain/model/clip"
	"github.com/nvnazarov/dubster/server/internal/domain/model/verification"
)

type CreateOptions struct {
	AuthorID    string
	Title       string
	Description string
	Segments    map[string]clip.Segment
	Roles       map[string]clip.Role
}

// Create creates a new [clip.Clip]. It will return an error
// if the clip is badly formed.
func Create(options CreateOptions) (*clip.Clip, error) {
	clip := &clip.Clip{
		ID:                 uuid.New().String(),
		AuthorID:           options.AuthorID,
		Title:              options.Title,
		Description:        options.Description,
		Segments:           options.Segments,
		Roles:              options.Roles,
		Rating:             0,
		VerificationStatus: verification.StatusNone,
		DateCreated:        time.Now(),
	}
	if err := verifyClip(clip); err != nil {
		return nil, err
	}
	return clip, nil
}
