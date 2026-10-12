package session

import (
	"context"
	"errors"
	"net/url"
	"sync"

	"github.com/nvnazarov/dubster/server/internal/misc/command"
	"github.com/nvnazarov/dubster/server/internal/misc/event"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
)

var (
	ErrNotHost                 = errors.New("not host")
	ErrParticipantWithoutRoles = errors.New("participant without roles")
	ErrRoleOccupied            = errors.New("role occupied")
	ErrNotRoleActor            = errors.New("not role actor")
	ErrNoSuchSegment           = errors.New("no such segment")
	ErrNoSuchRole              = errors.New("no such role")
	ErrHostKick                = errors.New("host kick")
	ErrState                   = errors.New("bad operation in current game state")
	ErrDisconnected            = errors.New("disconnected")
)

type Connection struct {
	userID       string
	session      *session
	disconnected bool
}

func (c *Connection) TakeRole(ctx context.Context, roleID string) error {
	if c.disconnected {
		return ErrDisconnected
	}
	return c.session.takeRole(c.userID, roleID)
}

func (c *Connection) ReleaseRole(ctx context.Context, roleID string) error {
	if c.disconnected {
		return ErrDisconnected
	}
	return c.session.releaseRole(c.userID, roleID)
}

func (c *Connection) KickParticipant(ctx context.Context, userID string) error {
	if c.disconnected {
		return ErrDisconnected
	}
	return c.session.kick(c.userID, userID)
}

func (c *Connection) SwitchToRolePicking(ctx context.Context) error {
	if c.disconnected {
		return ErrDisconnected
	}
	return c.session.switchToRolePicking(c.userID)
}

func (c *Connection) SwitchToSegmentsVoicing(ctx context.Context) error {
	if c.disconnected {
		return ErrDisconnected
	}
	return c.session.switchToSegmentsVoicing(c.userID)
}

func (c *Connection) GetRecordingUploadURL(ctx context.Context, segmentID string) (*url.URL, error) {
	if c.disconnected {
		return nil, ErrDisconnected
	}
	return nil, nil
}

func (c *Connection) Done(ctx context.Context) error {
	if c.disconnected {
		return ErrDisconnected
	}
	return c.session.done(c.userID)
}

// Events returns the current session state and a channel of events
// occuring since the state.
func (c *Connection) Events(ctx context.Context) (Session, <-chan any) {
	return c.session.events(ctx, c.userID)
}

func (c *Connection) Disconnect(ctx context.Context) {
	c.session.disconnect(c.userID)
	c.session = nil
	c.disconnected = true
}

// session represents a running (active) session.
type session struct {
	sessions         Repository
	clip             clip.Clip
	session          Session
	doneParticipants map[string]struct{}
	connections      map[string]*Connection
	subs             map[string]chan any
	phase            phase
	renderDispatcher command.Dispatcher[string]
	gradeDispatcher  command.Dispatcher[string]
	renderConsumer   event.Consumer[string]
	gradeConsumer    event.Consumer[string]
	mu               *sync.Mutex
}

type phase int

const (
	phaseLobby phase = iota
	phaseRolePicking
	phaseSegmentsVoicing
	phaseFinilizing
)

func newSession(s Session, c clip.Clip) *session {
	return &session{
		session:     s,
		clip:        c,
		connections: map[string]*Connection{},
		phase:       phaseLobby,
		mu:          &sync.Mutex{},
	}
}

// emit emits an event. emit is not concurrent safe.
func (s *session) emit(event any) {
	for userID, sub := range s.subs {
		select {
		case sub <- event:
			continue
		default:
		}
		s.unsub(userID)
	}
}

func (s *session) events(ctx context.Context, userID string) (Session, <-chan any) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.subs[userID]; ok {
		s.unsub(userID)
	}
	ch := make(chan any, 16)
	s.subs[userID] = ch
	go func() {
		select {
		case <-ctx.Done():
			s.unsub(userID)
		}
	}()
	return s.session, ch
}

func (s *session) connect(userID string) (*Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.connections[userID]
	if ok {
		return c, nil
	}
	if s.phase != phaseLobby {
		return nil, ErrState
	}
	c = &Connection{session: s}
	s.connections[userID] = c
	s.emit(EventUserConnected{UserID: userID})
	return c, nil
}

func (s *session) disconnect(userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.phase == phaseLobby {
		delete(s.connections, userID)
		delete(s.session.Participants, userID)
	}
	s.unsub(userID)
	s.emit(EventUserDisconnected{UserID: userID})
}

func (s *session) kick(kickerID string, subjectID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if kickerID != s.session.HostID {
		return ErrNotHost
	}
	if subjectID == s.session.HostID {
		return ErrHostKick
	}
	if s.phase == phaseFinilizing {
		return ErrState
	}
	if _, ok := s.session.Participants[subjectID]; !ok {
		return nil
	}
	delete(s.session.Participants, subjectID)
	if s.phase == phaseRolePicking {
		for roleID, actorID := range s.session.Actors {
			if actorID == subjectID {
				delete(s.session.Actors, roleID)
			}
		}
	}
	s.unsub(subjectID)
	s.emit(EventUserKicked{UserID: subjectID})
	return nil
}

func (s *session) switchToRolePicking(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if userID != s.session.HostID {
		return ErrNotHost
	}
	if s.phase != phaseLobby {
		return ErrState
	}
	s.phase = phaseRolePicking
	s.emit(EventRolePickingState{})
	return nil
}

func (s *session) switchToSegmentsVoicing(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if userID != s.session.HostID {
		return ErrNotHost
	}
	if s.phase != phaseRolePicking {
		return ErrState
	}
	for participantID := range s.session.Participants {
		hasRoles := false
		for _, actorID := range s.session.Actors {
			if participantID == actorID {
				hasRoles = true
				break
			}
		}
		if !hasRoles {
			return ErrParticipantWithoutRoles
		}
	}
	s.phase = phaseSegmentsVoicing
	s.emit(EventSegmentsVoicingState{})
	return nil
}

func (s *session) takeRole(userID, roleID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.session.Participants[userID]; !ok {
		return ErrNotParticipant
	}
	if s.phase != phaseRolePicking {
		return ErrState
	}
	if _, ok := s.clip.Roles[roleID]; !ok {
		return ErrNoSuchRole
	}
	if actorID, ok := s.session.Actors[roleID]; ok {
		if actorID != userID {
			return ErrRoleOccupied
		}
		return nil
	}
	s.session.Actors[roleID] = userID
	s.emit(EventRoleTaken{UserID: userID, RoleID: roleID})
	return nil
}

func (s *session) releaseRole(userID, roleID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.session.Participants[userID]; !ok {
		return ErrNotParticipant
	}
	if s.phase != phaseRolePicking {
		return ErrState
	}
	if _, ok := s.clip.Roles[roleID]; !ok {
		return ErrNoSuchRole
	}
	actorID, ok := s.session.Actors[roleID]
	if !ok {
		return nil
	}
	if actorID != userID {
		return ErrNotRoleActor
	}
	delete(s.session.Actors, roleID)
	s.emit(EventRoleReleased{UserID: userID, RoleID: roleID})
	return nil
}

func (s *session) done(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.session.Participants[userID]; !ok {
		return ErrNotParticipant
	}
	if s.phase != phaseSegmentsVoicing {
		return ErrState
	}
	s.doneParticipants[userID] = struct{}{}
	s.emit(EventUserDone{UserID: userID})
	if len(s.doneParticipants) == len(s.session.Participants) {
		s.phase = phaseFinilizing
		// TODO: handle dispatching errors.
		_ = s.gradeDispatcher.Dispatch(context.Background(), s.session.ID)
		_ = s.renderDispatcher.Dispatch(context.Background(), s.session.ID)
	}
	return nil
}

// unsub unsubscribes a user from the session's events stream.
// unsub is not concurrent safe.
func (s *session) unsub(userID string) {
	ch, ok := s.subs[userID]
	if !ok {
		return
	}
	delete(s.subs, userID)
	close(ch)
}

type hub struct {
	sessions map[string]*session
	mu       *sync.Mutex
}

func newHub() *hub {
	return &hub{
		sessions: map[string]*session{},
		mu:       &sync.Mutex{},
	}
}

func (h *hub) connect(p ConnectToSessionParams) (*Connection, error) {
	s, ok := h.sessions[p.SessionID]
	if !ok {
		return nil, ErrNotFound
	}
	return s.connect(p.UserID)
}

func (h *hub) create(s Session, c clip.Clip) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.sessions[s.ID] = newSession(s, c)
}
