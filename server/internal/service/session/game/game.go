package game

import (
	"context"
	"net/url"
	"sync"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/blob"
	"github.com/nvnazarov/dubster/server/internal/misc/command"
	"github.com/nvnazarov/dubster/server/internal/misc/event"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type State int

const (
	StateLobby State = iota
	StateRecord
	StateFinalize
)

type Game struct {
	gradeSession   command.Dispatcher[session.SessionID]
	renderSession  command.Dispatcher[session.SessionID]
	gradeConsumer  event.Consumer[EventGraded]
	renderConsumer event.Consumer[int]

	sessionID    session.SessionID
	hostID       string
	finished     map[string]struct{}
	participants map[string]struct{}
	actors       map[string]string
	sessions     session.Repository
	state        State
	recordings   blob.Uploader
	clip         clip.Clip
	subs         map[*sub]struct{}
	errGrade     error
	errRender    error

	mu          *sync.Mutex
	eventsMutex *sync.Mutex
}

type sub struct {
	events chan any
	once   *sync.Once
}

func (s *sub) Close() {
	s.once.Do(func() {
		close(s.events)
	})
}

func New() *Game {
	return &Game{}
}

func (g *Game) hasParticipant(userID string) bool {
	_, ok := g.participants[userID]
	return ok
}

func (g *Game) allFinished() bool {
	return len(g.participants) == len(g.finished)
}

func (g *Game) finish() {
	g.state = StateFinalize
	err := g.sessions.SaveFinished(context.Background(), session.Session{
		ID:           g.sessionID,
		Finished:     true,
		DateFinished: time.Now(),
	})
	if err != nil {
		// TODO: handle error.
		panic(err)
	}
	g.fire(EventGameFinished{})
	g.errGrade = g.gradeSession.Dispatch(context.Background(), g.sessionID)
	g.errRender = g.renderSession.Dispatch(context.Background(), g.sessionID)
}

func (g *Game) fire(event any) {
	g.eventsMutex.Lock()
	defer g.eventsMutex.Unlock()
	for s := range g.subs {
		select {
		case s.events <- event:
		default:
			delete(g.subs, s)
			s.Close()
		}
	}
}

func (g *Game) Events(ctx context.Context) <-chan any {
	out := make(chan any, 16)
	s := sub{
		events: out,
		once:   &sync.Once{},
	}
	g.subs[&s] = struct{}{}
	go func() {
		select {
		case <-ctx.Done():
			g.eventsMutex.Lock()
			defer g.eventsMutex.Unlock()
			delete(g.subs, &s)
			s.Close()
		}
	}()
	return s.events
}

func (g *Game) Start(ctx context.Context, userID string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.state != StateLobby {
		return ErrState
	}
	if g.hostID != userID {
		return ErrNotHost
	}
	err := g.sessions.SaveStarted(ctx, session.Session{
		ID:           g.sessionID,
		HostID:       g.hostID,
		ClipID:       g.clip.ID,
		Participants: g.participants,
		Actors:       g.actors,
		DateStarted:  time.Now(),
	})
	if err != nil {
		return err
	}
	g.state = StateRecord
	g.fire(EventGameStarted{})
	return nil
}

func (g *Game) TakeRole(userID, roleID string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.state != StateLobby {
		return ErrState
	}
	if !g.hasParticipant(userID) {
		return ErrNotParticipant
	}
	if _, ok := g.actors[roleID]; ok {
		return ErrRoleOccupied
	}
	g.actors[roleID] = userID
	g.fire(EventRoleTaken{UserID: userID, RoleID: roleID})
	return nil
}

func (g *Game) ReleaseRole(userID, roleID string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.state != StateLobby {
		return ErrState
	}
	if !g.hasParticipant(userID) {
		return ErrNotParticipant
	}
	actorID, ok := g.actors[userID]
	if !ok {
		return nil
	}
	if actorID != userID {
		return ErrNotRoleActor
	}
	delete(g.actors, roleID)
	g.fire(EventRoleReleased{UserID: userID, RoleID: roleID})
	return nil
}

func (g *Game) UploadURL(ctx context.Context, userID, segmentID string) (*url.URL, error) {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.state != StateRecord {
		return nil, ErrState
	}
	if !g.hasParticipant(userID) {
		return nil, ErrNotParticipant
	}
	if _, ok := g.finished[userID]; ok {
		return nil, ErrFinished
	}
	segment, ok := g.clip.Segments[segmentID]
	if !ok {
		return nil, ErrNoSuchSegment
	}
	if g.actors[segment.RoleID] != userID {
		return nil, ErrNotRoleActor
	}
	return g.recordings.UploadURL(ctx, segmentID)
}

func (g *Game) Kick(userID, kickID string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.hostID != userID {
		return ErrNotHost
	}
	if kickID == g.hostID {
		return ErrHostKick
	}
	delete(g.participants, kickID)
	for roleID := range g.clip.Roles {
		if g.actors[roleID] == kickID {
			delete(g.actors, roleID)
		}
	}
	g.fire(EventUserKicked{UserID: kickID})
	if g.allFinished() {
		g.finish()
	}
	return nil
}

func (g *Game) Finish(userID string) error {
	g.mu.Lock()
	defer g.mu.Unlock()
	if g.state != StateRecord {
		return ErrState
	}
	if !g.hasParticipant(userID) {
		return ErrNotParticipant
	}
	if _, ok := g.finished[userID]; ok {
		return nil
	}
	g.finished[userID] = struct{}{}
	g.fire(EventUserFinished{UserID: userID})
	if g.allFinished() {
		g.finish()
	}
	return nil
}
