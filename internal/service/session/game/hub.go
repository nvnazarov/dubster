package game

import (
	"errors"
	"sync"
)

var (
	ErrNotFound = errors.New("game not found")
)

type Hub struct {
	games map[string]*Game

	mu *sync.Mutex
}

func NewHub() Hub {
	return Hub{
		games: map[string]*Game{},
		mu:    &sync.Mutex{},
	}
}

func (h *Hub) Get(sessionID string) (*Game, error) {
	h.mu.Lock()
	defer h.mu.Unlock()
	game, ok := h.games[sessionID]
	if !ok {
		return nil, ErrNotFound
	}
	return game, nil
}

func (h *Hub) Create(sessionID string) *Game {
	h.mu.Lock()
	defer h.mu.Unlock()
	game := New()
	h.games[sessionID] = game
	return game
}
