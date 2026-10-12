package session

import (
	"context"
	"errors"
)

var ErrNotFound = errors.New("session not found")

type Repository interface {
	ByParticipant(ctx context.Context, userID string) ([]Session, error)
	SaveGraded(ctx context.Context, session Session) error
	SaveRendered(ctx context.Context, session Session) error
	SaveFinished(ctx context.Context, session Session) error
	Save(ctx context.Context, session Session) error
	Get(ctx context.Context, sessionID string) (Session, error)
}
