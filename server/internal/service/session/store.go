package session

import (
	"context"
	"errors"
	"net/url"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
)

type Store struct {
	renders  blob.Downloader
	sessions Repository
}

func NewStore() *Store {
	return &Store{}
}

func (s *Store) RenderDownloadURL(ctx context.Context, userID, sessionID string) (*url.URL, error) {
	session, err := s.sessions.Get(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if _, ok := session.Participants[userID]; !ok {
		return nil, errors.New("not participant")
	}
	return s.renders.DownloadURL(ctx, sessionID)
}
