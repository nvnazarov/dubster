package session

import (
	"context"
	"errors"
	"log/slog"
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
	logger   *slog.Logger
}

func NewService(sessions Repository, clips clip.Repository, renders blob.Downloader, logger *slog.Logger) *Service {
	return &Service{
		clips:    clips,
		sessions: sessions,
		renders:  renders,
		hub:      newHub(sessions),
		logger:   logger,
	}
}

type CreateSessionParams struct {
	ClipID string
	HostID string
}

func (s *Service) CreateSession(ctx context.Context, p CreateSessionParams) (Session, error) {
	clip, err := s.clips.Get(ctx, p.ClipID)
	if err != nil {
		s.logger.Error("session service: get clip: error", slog.Any("error", err))
		return Session{}, err
	}
	// if !clip.Verified {
	// 	return Session{}, ErrClipNotVerified
	// }
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
		s.logger.Error("session service: save session: error", slog.Any("error", err))
		return session, err
	}
	s.hub.create(session, clip)
	return session, nil
}

type GetSessionParams struct {
	SessionID string
	UserID    string
}

func (s *Service) GetSession(ctx context.Context, p GetSessionParams) (Session, error) {
	session, err := s.sessions.Get(ctx, p.SessionID)
	if err != nil {
		return Session{}, err
	}
	if _, ok := session.Participants[p.UserID]; !ok {
		return Session{}, ErrNotParticipant
	}
	return session, nil
}

func (c *Service) GetUserSessions(ctx context.Context, userID string) ([]Session, error) {
	return c.sessions.ByParticipant(ctx, userID)
}

type GetSessionRenderDownloadURLParams struct {
	UserID    string
	SessionID string
}

func (s *Service) GetSessionRenderDownloadURL(ctx context.Context, p GetSessionRenderDownloadURLParams) (*url.URL, error) {
	session, err := s.sessions.Get(ctx, p.SessionID)
	if err != nil {
		return nil, err
	}
	if _, ok := session.Participants[p.UserID]; !ok {
		return nil, ErrNotParticipant
	}
	return s.renders.DownloadURL(ctx, p.SessionID)
}

type ConnectToSessionParams struct {
	UserID    string
	SessionID string
}

func (s *Service) ConnectToSession(ctx context.Context, p ConnectToSessionParams) (*Connection, error) {
	return s.hub.connect(p)
}
