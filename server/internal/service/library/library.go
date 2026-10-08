package library

import (
	"context"
	"errors"

	"github.com/nvnazarov/dubster/server/internal/service/clip"
)

type InvalidParams error

var (
	ErrInvalidCursor         InvalidParams = errors.New("cursor is invalid")
	ErrNegativeNumberOfRoles InvalidParams = errors.New("negative number of roles")
)

type Order int

const (
	OrderDefault Order = iota
	OrderRatingAsc
	OrderRatingDesc
)

type SearchParams struct {
	Title         string
	AuthorID      string
	NumberOfRoles int
	Order         Order
}

type Batch struct {
	Clips         []clip.Clip
	RevertCursor  string
	AdvanceCursor string
}

type Searcher interface {
	NewCursor(ctx context.Context, p SearchParams) (string, error)
	BatchAt(ctx context.Context, cursor string) (Batch, error)
}

type Library struct {
	searcher Searcher
}

func New(searcher Searcher) Library {
	return Library{searcher: searcher}
}

func (s *Library) NewCursor(ctx context.Context, p SearchParams) (string, error) {
	if p.NumberOfRoles < 0 {
		return "", ErrNegativeNumberOfRoles
	}
	return s.searcher.NewCursor(ctx, p)
}

func (s *Library) BatchAt(ctx context.Context, cursor string) (Batch, error) {
	return s.searcher.BatchAt(ctx, cursor)
}
