package session

import (
	"context"
	"encoding/json/v2"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ByParticipant(ctx context.Context, userID string) ([]session.Session, error) {
	return nil, nil
}

func (r *Repository) Save(ctx context.Context, s session.Session) error {
	participantsJSON, err := json.Marshal(s.Participants)
	if err != nil {
		return err
	}
	actorsJSON, err := json.Marshal(s.Actors)
	if err != nil {
		return err
	}
	gradesJSON, err := json.Marshal(s.Grades)
	if err != nil {
		return err
	}
	const sql = `
    INSERT INTO sessions(
        id,
		host_id,
		clip_id,
		participants,
		actors,
		grades,
		finished,
		rendered,
		date_created,
		date_started,
		date_finished,
		date_rendered,
		date_graded
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    ON CONFLICT (id) DO UPDATE SET
		host_id = EXCLUDED.host_id,
		clip_id = EXCLUDED.clip_id,
		participants = EXCLUDED.participants,
		actors = EXCLUDED.actors,
		grades = EXCLUDED.grades,
		finished = EXCLUDED.finished,
		rendered = EXCLUDED.rendered,
		date_created = EXCLUDED.date_created,
		date_started = EXCLUDED.date_started,
		date_finished = EXCLUDED.date_finished,
		date_rendered = EXCLUDED.date_rendered,
		date_graded = EXCLUDED.date_graded`
	_, err = r.pool.Exec(
		ctx,
		sql,
		s.ID,
		s.HostID,
		s.ClipID,
		participantsJSON,
		actorsJSON,
		gradesJSON,
		s.Finished,
		s.Rendered,
		s.DateCreated,
		s.DateStarted,
		s.DateFinished,
		s.DateRendered,
		s.DateGraded,
	)
	if err != nil {
		return err
	}
	return nil
}

func (r *Repository) SaveFinished(ctx context.Context, s session.Session) error {
	const sql = `
    UPDATE sessions SET finished = $2, date_finished = $3
    WHERE id = $1`
	tag, err := r.pool.Exec(
		ctx,
		sql,
		s.ID,
		s.Finished,
		s.DateFinished,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return session.ErrNotFound
	}
	return nil
}

func (r *Repository) SaveGraded(ctx context.Context, s session.Session) error {
	const sql = `
    UPDATE sessions SET grades = $2, date_graded = $3
    WHERE id = $1`
	tag, err := r.pool.Exec(
		ctx,
		sql,
		s.ID,
		s.Grades,
		s.DateGraded,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return session.ErrNotFound
	}
	return nil
}

func (r *Repository) SaveRendered(ctx context.Context, s session.Session) error {
	const sql = `
    UPDATE sessions SET
		rendered = $2,
		date_rendered = $3
    WHERE id = $1`
	tag, err := r.pool.Exec(
		ctx,
		sql,
		s.ID,
		s.Rendered,
		s.DateRendered,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return session.ErrNotFound
	}
	return nil
}

func (r *Repository) Get(ctx context.Context, sessionID string) (session.Session, error) {
	const sql = `
	SELECT
		id,
		host_id,
		clip_id,
		participants,
		actors,
		grades,
		finished,
		rendered,
		date_created,
		date_started,
		date_finished,
		date_rendered,
		date_graded
	FROM sessions
	WHERE id = $1`
	row := r.pool.QueryRow(ctx, sql, sessionID)
	var s session.Session
	var participantsJSON, actorsJSON, gradesJSON []byte
	err := row.Scan(
		&s.ID,
		&s.HostID,
		&s.ClipID,
		&participantsJSON,
		&actorsJSON,
		&gradesJSON,
		&s.Finished,
		&s.Rendered,
		&s.DateCreated,
		&s.DateStarted,
		&s.DateFinished,
		&s.DateRendered,
		&s.DateGraded)
	if errors.Is(err, pgx.ErrNoRows) {
		return session.Session{}, session.ErrNotFound
	}
	if err != nil {
		return session.Session{}, err
	}
	if err := json.Unmarshal(participantsJSON, &s.Participants); err != nil {
		return session.Session{}, err
	}
	if err := json.Unmarshal(actorsJSON, &s.Actors); err != nil {
		return session.Session{}, err
	}
	if err := json.Unmarshal(gradesJSON, &s.Grades); err != nil {
		return session.Session{}, err
	}
	return s, nil
}
