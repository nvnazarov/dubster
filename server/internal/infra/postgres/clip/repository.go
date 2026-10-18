package clip

import (
	"context"
	jsonv1 "encoding/json"
	"encoding/json/v2"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/server/internal/misc/util/errorsutil"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/library"
)

var (
	_ clip.Repository  = (*Repository)(nil)
	_ library.Searcher = (*Repository)(nil)
	_ clip.Tx          = (*Tx)(nil)
)

type Repository struct {
	pool *pgxpool.Pool
}

type Tx struct {
	tx pgx.Tx
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

type cursor struct {
	LastClipID    string        `json:"lastClipID"`
	Order         library.Order `json:"order"`
	AuthorID      string        `json:"authorID"`
	NumberOfRoles int           `json:"numberOfRoles"`
	Title         string        `json:"title"`
}

func (c *cursor) encode() (string, error) {
	bytes, err := json.Marshal(c)
	if err != nil {
		return "", errorsutil.WrapError(err)
	}
	return string(bytes), nil
}

func (c *cursor) decode(encoded string) error {
	err := json.Unmarshal([]byte(encoded), c)
	if _, ok := errors.AsType[*json.SemanticError](err); ok {
		return library.ErrInvalidCursor
	}
	if err != nil {
		return errorsutil.WrapError(err)
	}
	return nil
}

func (r *Repository) NewCursor(ctx context.Context, params library.SearchParams) (string, error) {
	c := cursor{
		Order:         params.Order,
		AuthorID:      params.AuthorID,
		NumberOfRoles: params.NumberOfRoles,
		Title:         params.Title,
	}
	return c.encode()
}

func (r *Repository) BatchAt(ctx context.Context, encodedCursor string) (library.Batch, error) {
	// TODO: actually implement filtering.
	var c cursor
	if err := c.decode(encodedCursor); err != nil {
		return library.Batch{}, err
	}
	const sql = `
	SELECT
		id,
        author_id,
        title,
        description,
        segments,
        roles,
        rating,
        verified,
        date_created,
        date_verified
	FROM clips
	WHERE id > $1 AND deleted = false
	ORDER BY id ASC
	LIMIT 20`
	rows, err := r.pool.Query(ctx, sql, c.LastClipID)
	if err != nil {
		return library.Batch{}, err
	}
	defer rows.Close()
	clips := make([]clip.Clip, 0)
	for rows.Next() {
		var c clip.Clip
		var segmentsJSON, rolesJSON []byte
		err := rows.Scan(
			&c.ID,
			&c.AuthorID,
			&c.Title,
			&c.Description,
			&segmentsJSON,
			&rolesJSON,
			&c.Rating,
			&c.Verified,
			&c.DateCreated,
			&c.DateVerified,
		)
		if err != nil {
			return library.Batch{}, err
		}
		if err := json.Unmarshal(segmentsJSON, &c.Segments, jsonv1.FormatDurationAsNano(true)); err != nil {
			return library.Batch{}, err
		}
		if err := json.Unmarshal(rolesJSON, &c.Roles); err != nil {
			return library.Batch{}, err
		}
		clips = append(clips, c)
	}
	var advanceCursor string
	if len(clips) > 0 {
		ac := c
		ac.LastClipID = clips[len(clips)-1].ID
		if enc, err := ac.encode(); err != nil {
			return library.Batch{}, err
		} else {
			advanceCursor = enc
		}
	}
	return library.Batch{
		AdvanceCursor: advanceCursor,
		RevertCursor:  "",
		Clips:         clips,
	}, nil
}

func (r *Repository) Save(ctx context.Context, clip clip.Clip) error {
	return saveClip(ctx, r.pool, clip)
}

func (r *Repository) Get(ctx context.Context, clipID string) (clip.Clip, error) {
	return getClip(ctx, r.pool, clipID)
}

func (r *Repository) Delete(ctx context.Context, clipID string) error {
	return deleteClip(ctx, r.pool, clipID)
}

func (r *Repository) BeginTx(ctx context.Context) (clip.Tx, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	return &Tx{tx: tx}, nil
}

func (tx *Tx) Commit(ctx context.Context) error {
	return tx.tx.Commit(ctx)
}

func (tx *Tx) Rollback(ctx context.Context) error {
	return tx.tx.Rollback(ctx)
}

func (tx *Tx) Save(ctx context.Context, clip clip.Clip) error {
	return saveClip(ctx, tx.tx, clip)
}

func (tx *Tx) Get(ctx context.Context, clipID string) (clip.Clip, error) {
	return getClip(ctx, tx.tx, clipID)
}

func (tx *Tx) Delete(ctx context.Context, clipID string) error {
	return deleteClip(ctx, tx.tx, clipID)
}

type executor interface {
	Exec(context.Context, string, ...any) (pgconn.CommandTag, error)
	QueryRow(context.Context, string, ...any) pgx.Row
}

func getClip(ctx context.Context, exec executor, clipID string) (clip.Clip, error) {
	var c clip.Clip
	var segmentsJSON, rolesJSON []byte
	const sql = `
	SELECT
        id,
        author_id,
        title,
        description,
        segments,
        roles,
        rating,
        verified,
        date_created,
        date_verified
    FROM clips
    WHERE id = $1`
	err := exec.QueryRow(ctx, sql, clipID).Scan(
		&c.ID,
		&c.AuthorID,
		&c.Title,
		&c.Description,
		&segmentsJSON,
		&rolesJSON,
		&c.Rating,
		&c.Verified,
		&c.DateCreated,
		&c.DateVerified,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return clip.Clip{}, clip.ErrNotFound
	}
	if err != nil {
		return clip.Clip{}, err
	}
	if err := json.Unmarshal(segmentsJSON, &c.Segments, jsonv1.FormatDurationAsNano(true)); err != nil {
		return clip.Clip{}, err
	}
	if err := json.Unmarshal(rolesJSON, &c.Roles); err != nil {
		return clip.Clip{}, err
	}
	return c, nil
}

func deleteClip(ctx context.Context, exec executor, clipID string) error {
	tag, err := exec.Exec(ctx, `UPDATE clips SET deleted = true WHERE id = $1`, clipID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return clip.ErrNotFound
	}
	return nil
}

func saveClip(ctx context.Context, exec executor, c clip.Clip) error {
	segmentsJSON, err := json.Marshal(c.Segments, jsonv1.FormatDurationAsNano(true))
	if err != nil {
		return err
	}
	rolesJSON, err := json.Marshal(c.Roles)
	if err != nil {
		return err
	}
	const sql = `
    INSERT INTO clips(
        id,
        author_id,
        title,
        description,
        segments,
        roles,
        rating,
        verified,
        date_created,
        date_verified
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
        author_id = EXCLUDED.author_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        segments = EXCLUDED.segments,
        roles = EXCLUDED.roles,
        rating = EXCLUDED.rating,
        verified = EXCLUDED.verified,
        date_created = EXCLUDED.date_created,
        date_verified = EXCLUDED.date_verified`
	_, err = exec.Exec(
		ctx,
		sql,
		c.ID,
		c.AuthorID,
		c.Title,
		c.Description,
		segmentsJSON,
		rolesJSON,
		c.Rating,
		c.Verified,
		c.DateCreated,
		c.DateVerified,
	)
	return err
}
