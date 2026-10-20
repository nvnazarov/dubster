package session

import (
	"context"
	"errors"
	"maps"
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

type SessionState struct {
	Clip         clip.Clip
	Participants map[string]struct{}
	Done         map[string]struct{}
	Actors       map[string]string
	Grades       map[string]float64
	Phase        Phase
}

// Events returns the current session state and a channel of events
// occuring since the state.
func (c *Connection) Events(ctx context.Context) (SessionState, <-chan any) {
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
	phase            Phase
	renderDispatcher command.Dispatcher[string]
	gradeDispatcher  command.Dispatcher[string]
	renderConsumer   event.Consumer[string]
	gradeConsumer    event.Consumer[string]
	mu               *sync.Mutex
	cond             *sync.Cond
}

type Phase int

const (
	PhaseLobby Phase = iota
	PhaseRolePicking
	PhaseSegmentsVoicing
	PhaseFinalizing
)

func newSession(s Session, sessions Repository, c clip.Clip) *session {
	session := &session{
		sessions:    sessions,
		session:     s,
		clip:        c,
		subs:        map[string]chan any{},
		connections: map[string]*Connection{},
		phase:       PhaseLobby,
		mu:          &sync.Mutex{},
		cond:        sync.NewCond(&sync.Mutex{}),
	}
	session.finalizeIfAllParticipantsDone()
	return session
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

func (s *session) events(ctx context.Context, userID string) (SessionState, <-chan any) {
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
	return SessionState{
		Clip:         s.clip,
		Participants: s.session.Participants,
		Done:         maps.Clone(s.doneParticipants),
		Actors:       maps.Clone(s.session.Actors),
		Grades:       maps.Clone(s.session.Grades),
		Phase:        s.phase,
	}, ch
}

func (s *session) connect(userID string) (*Connection, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	c, ok := s.connections[userID]
	if ok {
		return c, nil
	}
	if s.phase != PhaseLobby {
		return nil, ErrState
	}
	c = &Connection{session: s, userID: userID}
	s.connections[userID] = c
	s.emit(EventUserConnected{UserID: userID})
	return c, nil
}

func (s *session) disconnect(userID string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if s.phase == PhaseLobby {
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
	if s.phase == PhaseFinalizing {
		return ErrState
	}
	if _, ok := s.session.Participants[subjectID]; !ok {
		return nil
	}
	delete(s.doneParticipants, subjectID)
	delete(s.session.Participants, subjectID)
	if s.phase == PhaseRolePicking {
		for roleID, actorID := range s.session.Actors {
			if actorID == subjectID {
				delete(s.session.Actors, roleID)
			}
		}
	}
	s.unsub(subjectID)
	s.emit(EventUserKicked{UserID: subjectID})
	s.cond.Signal()
	return nil
}

func (s *session) switchToRolePicking(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if userID != s.session.HostID {
		return ErrNotHost
	}
	if s.phase != PhaseLobby {
		return ErrState
	}
	if err := s.sessions.Save(context.TODO(), s.session); err != nil {
		return err
	}
	s.phase = PhaseRolePicking
	s.emit(EventRolePickingState{})
	return nil
}

func (s *session) switchToSegmentsVoicing(userID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if userID != s.session.HostID {
		return ErrNotHost
	}
	if s.phase != PhaseRolePicking {
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
	if err := s.sessions.Save(context.TODO(), s.session); err != nil {
		return err
	}
	s.phase = PhaseSegmentsVoicing
	s.emit(EventSegmentsVoicingState{})
	return nil
}

func (s *session) takeRole(userID, roleID string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.session.Participants[userID]; !ok {
		return ErrNotParticipant
	}
	if s.phase != PhaseRolePicking {
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
	if s.phase != PhaseRolePicking {
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
	if s.phase != PhaseSegmentsVoicing {
		return ErrState
	}
	s.doneParticipants[userID] = struct{}{}
	s.emit(EventUserDone{UserID: userID})
	s.cond.Signal()
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

func (s *session) finalizeIfAllParticipantsDone() {
	go func() {
		s.cond.L.Lock()
		defer s.cond.L.Unlock()
		for s.phase != PhaseSegmentsVoicing && len(s.doneParticipants) != len(s.session.Participants) {
			s.cond.Wait()
		}
		if len(s.doneParticipants) == len(s.session.Participants) {
			s.phase = PhaseFinalizing
			s.emit(EventFinalizingState{})
			// TODO: handle errors.
			_ = s.sessions.Save(context.TODO(), s.session)
			_ = s.gradeDispatcher.Dispatch(context.TODO(), s.session.ID)
			_ = s.renderDispatcher.Dispatch(context.TODO(), s.session.ID)
		}
	}()
}

type hub struct {
	sessions       Repository
	activeSessions map[string]*session
	mu             *sync.Mutex
}

func newHub(sessions Repository) *hub {
	return &hub{
		sessions:       sessions,
		activeSessions: map[string]*session{},
		mu:             &sync.Mutex{},
	}
}

func (h *hub) connect(p ConnectToSessionParams) (*Connection, error) {
	s, ok := h.activeSessions[p.SessionID]
	if !ok {
		return nil, ErrNotFound
	}
	return s.connect(p.UserID)
}

func (h *hub) create(s Session, c clip.Clip) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.activeSessions[s.ID] = newSession(s, h.sessions, c)
}
