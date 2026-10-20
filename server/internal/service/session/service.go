package session

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"time"
	"uuid"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
)

var (
	ErrNotParticipant  = errors.New("not participant")
	ErrClipNotVerified = errors.New("clip not verified")
)

type Service struct {
	clips    clip.Repository
	sessions Repository
	renders  blob.Downloader
	hub      *hub
}

func NewService(sessions Repository, clips clip.Repository, renders blob.Downloader) *Service {
	return &Service{
		clips:    clips,
		sessions: sessions,
		renders:  renders,
		hub:      newHub(sessions),
	}
}

type CreateSessionParams struct {
	ClipID string
	HostID string
}

func (s *Service) CreateSession(ctx context.Context, p CreateSessionParams) (Session, error) {
	c, err := s.clips.Get(ctx, p.ClipID)
	if err != nil {
		if errors.Is(err, clip.ErrNotFound) {
			return Session{}, err
		}
		return Session{}, fmt.Errorf("get clip \"%s\": %w", p.ClipID, err)
	}
	session := Session{
		ID:           uuid.New().String(),
		HostID:       p.HostID,
		ClipID:       p.ClipID,
		Participants: map[string]struct{}{p.HostID: struct{}{}},
		Actors:       map[string]string{},
		Grades:       nil,
		Finished:     false,
		Rendered:     false,
		DateCreated:  time.Now(),
	}
	if err := s.sessions.Save(ctx, session); err != nil {
		return session, fmt.Errorf("save session: %w", err)
	}
	s.hub.create(session, c)
	return session, nil
}

type GetSessionParams struct {
	SessionID string
	UserID    string
}

func (s *Service) GetSession(ctx context.Context, p GetSessionParams) (Session, error) {
	session, err := s.sessions.Get(ctx, p.SessionID)
	if err != nil {
		return Session{}, fmt.Errorf("get session \"%s\": %w", p.SessionID, err)
	}
	if _, ok := session.Participants[p.UserID]; !ok {
		return Session{}, ErrNotParticipant
	}
	return session, nil
}

func (c *Service) GetUserSessions(ctx context.Context, userID string) ([]Session, error) {
	sessions, err := c.sessions.ByParticipant(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("get user \"%s\" sessions: %w", userID, err)
	}
	return sessions, nil
}

type GetSessionRenderDownloadURLParams struct {
	UserID    string
	SessionID string
}

func (s *Service) GetSessionRenderDownloadURL(ctx context.Context, p GetSessionRenderDownloadURLParams) (*url.URL, error) {
	session, err := s.sessions.Get(ctx, p.SessionID)
	if err != nil {
		return nil, fmt.Errorf("get session \"%s\": %w", p.SessionID, err)
	}
	if _, ok := session.Participants[p.UserID]; !ok {
		return nil, ErrNotParticipant
	}
	url, err := s.renders.DownloadURL(ctx, p.SessionID)
	if err != nil {
		return nil, fmt.Errorf("generate render download url for session \"%s\": %w", p.SessionID, err)
	}
	return url, nil
}

type ConnectToSessionParams struct {
	UserID    string
	SessionID string
}

func (s *Service) ConnectToSession(ctx context.Context, p ConnectToSessionParams) (*Connection, error) {
	return s.hub.connect(p)
}
