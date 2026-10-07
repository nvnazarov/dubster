package postgres

import (
	"context"
	"encoding/json/v2"
	"errors"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/nvnazarov/dubster/internal/service/clip"
	"github.com/nvnazarov/dubster/internal/service/library"
	"github.com/nvnazarov/dubster/internal/util/errorsutil"
)

type Library struct {
	pool *pgxpool.Pool
}

type Tx struct {
}

func NewLibrary(pool *pgxpool.Pool) Library {
	return Library{pool: pool}
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
	return errorsutil.WrapError(err)
}

func (Library) NewCursor(ctx context.Context, params library.SearchParams) (string, error) {
	c := cursor{
		Order:         params.Order,
		AuthorID:      params.AuthorID,
		NumberOfRoles: params.NumberOfRoles,
		Title:         params.Title,
	}
	return c.encode()
}

func (lib Library) BatchAt(ctx context.Context, encodedCursor string) (library.Batch, error) {
	var c cursor
	if err := c.decode(encodedCursor); err != nil {
		return library.Batch{}, err
	}
	rows, err := lib.pool.Query(ctx, `
	SELECT
		id,
		title,
		description,
		rating,
		date_created,
		segments,
		roles,
		verified,
		dateCreated,
	FROM
		clips
	WHERE
		id > $1 AND title ILIKE "%$2%" AND 
	ORDER BY
		id ASC
	`, c.LastClipID, c.Title)
	if err != nil {
		return library.Batch{}, err
	}
	defer rows.Close()
	// pgx.CollectRows(rows, pgx.RowTo[])
	return library.Batch{}, nil
}

func (lib Library) Save(ctx context.Context, clip clip.Clip) error {
	panic("not implemented")
}

func (lib Library) Get(ctx context.Context, clipID string) (clip.Clip, error) {
	panic("not implemented")
}

func (lib Library) Delete(ctx context.Context, clipID string) error {
	panic("not implemented")
}

func (lib Library) BeginTx(ctx context.Context) (clip.Tx, error) {
	panic("not implemented")
}

func (tx Tx) Commit(ctx context.Context) error {
	panic("not implemented")
}

func (tx Tx) Rollback(ctx context.Context) error {
	panic("not implemented")
}

func (tx Tx) Save(ctx context.Context, clip clip.Clip) error {
	panic("not implemented")
}

func (tx Tx) Get(ctx context.Context, clipID string) (clip.Clip, error) {
	panic("not implemented")
}

func (tx Tx) Delete(ctx context.Context, clipID string) error {
	panic("not implemented")
}
