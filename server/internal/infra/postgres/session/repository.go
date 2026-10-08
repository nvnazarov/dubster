package session

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return Repository{pool: pool}
}

func (r *Repository) ByParticipant(ctx context.Context, userID string) ([]session.Session, error) {
	return nil, nil
}

func (r *Repository) SaveStarted(ctx context.Context, session session.Session) error {
	_, err := r.pool.Exec(ctx, `
	INSERT INTO sessions(
		id,
		host_id,
		clip_id,
		participants,
		actors,
		date_started
	) VALUES ($1, $2, $3, $4, $5, $6)
	ON CONFLICT DO UPDATE SET
		id = EXCLUDED.id,
		host_id = EXCLUDED.host_id,
		clip_id = EXCLUDED.clip_id,
		participants = EXCLUDED.participants,
		actors = EXCLUDED.actors,
		date_started = EXCLUDED.date_started
	`,
		session.ID,
		session.HostID,
		session.ClipID,
		session.Participants,
		session.Actors,
		session.DateStarted,
	)
	return err
}

func (r *Repository) SaveFinished(ctx context.Context, session session.Session) error {
	_, err := r.pool.Exec(ctx, `
	UPDATE sessions
	SET
		finished = $2
		date_finished = $3
	WHERE id = $1
	`,
		session.ID,
		session.Finished,
		session.DateFinished,
	)
	return err
}

func (r *Repository) SaveGraded(ctx context.Context, session session.Session) error {
	_, err := r.pool.Exec(ctx, `
	UPDATE sessions
	SET
		grades = $2,
		date_graded = $3
	WHERE id = $1
	`,
		session.ID,
		session.Grades,
		session.DateGraded,
	)
	return err
}

func (r *Repository) SaveRendered(ctx context.Context, session session.Session) error {
	_, err := r.pool.Exec(ctx, `
	UPDATE sessions
	SET
		rendered = $2,
		date_rendered = $3
	WHERE id = $1
	`,
		session.ID,
		session.Rendered,
		session.DateRendered,
	)
	return err
}

func (r *Repository) Get(ctx context.Context, sessionID string) (session.Session, error) {
	row := r.pool.QueryRow(ctx, `
	SELECT
		id,
		host_id,
		clip_id,
		participants,
		actors,
		grades,
		rendered,
		date_started,
		date_finished,
		date_rendered,
		date_graded
	FROM sessions
	WHERE id = $1
	`, sessionID)
	var s session.Session
	if err := row.Scan(
		&s.ID,
		&s.HostID,
		&s.ClipID,
		&s.Participants,
		&s.Actors,
		&s.Grades,
		&s.Rendered,
		&s.DateStarted,
		&s.DateFinished,
		&s.DateRendered,
		&s.DateGraded); err != nil {
		return session.Session{}, err
	}
	return session.Session{}, nil
}
