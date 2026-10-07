package session

import "context"

type Repository interface {
	ByParticipant(ctx context.Context, userID string) ([]Session, error)
	SaveStarted(ctx context.Context, session Session) error
	SaveGraded(ctx context.Context, session Session) error
	SaveRendered(ctx context.Context, session Session) error
	SaveFinished(ctx context.Context, session Session) error
	Get(ctx context.Context, sessionID SessionID) (Session, error)
}
