package api

import (
	"context"
	jsonv1 "encoding/json"
	"encoding/json/jsontext"
	"encoding/json/v2"
	"errors"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type SessionsRouter struct {
	chi.Router
	service *session.Service
	logger  *slog.Logger
}

func NewSessionsRouter(service *session.Service, logger *slog.Logger) SessionsRouter {
	chiRouter := chi.NewRouter()
	r := SessionsRouter{chiRouter, service, logger}
	r.With(Authenticate).Post("/", r.CreateSession)
	r.With(Authenticate).Get("/my", r.GetUserSessions)
	r.With(Authenticate).Get("/{sessionID}", r.GetSession)
	r.With(Authenticate).Get("/{sessionID}/download", r.DownloadSessionRender)
	r.With(Authenticate).Get("/{sessionID}/connect", r.ConnectToSession)
	return r
}

func webSocketSendJSON(ctx context.Context, ws *websocket.Conn, message any) error {
	raw, err := json.Marshal(message, jsonv1.FormatDurationAsNano(true))
	if err != nil {
		return fmt.Errorf("json marshal message: %w", err)
	}
	if err := ws.Write(ctx, websocket.MessageText, raw); err != nil {
		return fmt.Errorf("send message over websocket: %w", err)
	}
	return nil
}

type Message struct {
	Event string `json:"event"`
	Data  any    `json:"data,omitempty"`
}

func serializePhase(phase session.Phase) string {
	switch phase {
	case session.PhaseLobby:
		return "lobby"
	case session.PhaseRolePicking:
		return "rolePicking"
	case session.PhaseSegmentsVoicing:
		return "segmentsVoicing"
	case session.PhaseFinalizing:
		return "finalizing"
	default:
		return ""
	}
}

func (sr *SessionsRouter) ConnectToSession(w http.ResponseWriter, r *http.Request) {
	ws, err := websocket.Accept(w, r, &websocket.AcceptOptions{InsecureSkipVerify: true})
	if err != nil {
		sr.logger.Error("failed to accept websocket connection", slog.Any("error", err))
		return
	}
	defer ws.CloseNow()
	ctx, cancel := context.WithCancel(r.Context())
	user := UserFromContext(ctx)
	sessionID := chi.URLParam(r, "sessionID")
	conn, err := sr.service.ConnectToSession(ctx, session.ConnectToSessionParams{
		UserID:    user.ID,
		SessionID: sessionID,
	})
	if err != nil {
		switch {
		case errors.Is(err, session.ErrNotFound):
			ws.Close(websocket.StatusNormalClosure, "session not found")
		default:
			sr.logger.Error("failed to connect to session", slog.Any("error", err))
			ws.Close(websocket.StatusInternalError, "internal server error")
		}
		return
	}
	go func() {
		s, events := conn.Events(ctx)
		if err = webSocketSendJSON(ctx, ws, Message{
			Event: "currentState",
			Data: struct {
				Clip         clip.Clip           `json:"clip"`
				Participants map[string]struct{} `json:"participants"`
				Done         map[string]struct{} `json:"done"`
				Actors       map[string]string   `json:"actors"`
				Grades       map[string]float64  `json:"grades"`
				Phase        string              `json:"phase"`
			}{
				Clip:         s.Clip,
				Participants: s.Participants,
				Done:         s.Done,
				Actors:       s.Actors,
				Grades:       s.Grades,
				Phase:        serializePhase(s.Phase),
			},
		}); err != nil {
			sr.logger.Error("failed to send a message over websocket", slog.Any("error", err))
			cancel()
			return
		}
		for event := range events {
			var err error
			switch event := event.(type) {
			case session.EventRolePickingState:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "switchedToRolePicking",
				})
			case session.EventSegmentsVoicingState:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "switchedToSegmentsVoicing",
				})
			case session.EventRoleReleased:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "roleReleased",
					Data: struct {
						UserID string `json:"userID"`
						RoleID string `json:"roleID"`
					}{
						UserID: event.UserID,
						RoleID: event.RoleID,
					},
				})
			case session.EventRoleTaken:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "roleTaken",
					Data: struct {
						UserID string `json:"userID"`
						RoleID string `json:"roleID"`
					}{
						UserID: event.UserID,
						RoleID: event.RoleID,
					},
				})
			case session.EventUserConnected:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "userConnected",
					Data: struct {
						UserID string `json:"userID"`
					}{
						UserID: event.UserID,
					},
				})
			case session.EventUserDisconnected:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "userDisconnected",
					Data: struct {
						UserID string `json:"userID"`
					}{
						UserID: event.UserID,
					},
				})
			case session.EventUserKicked:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "userKicked",
					Data: struct {
						UserID string `json:"userID"`
					}{
						UserID: event.UserID,
					},
				})
			case session.EventUserDone:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "userDone",
					Data: struct {
						UserID string `json:"userID"`
					}{
						UserID: event.UserID,
					},
				})
			case session.EventGraded:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "graded",
					Data: struct {
						Grades map[string]float64 `json:"grades"`
					}{
						Grades: event.Grades,
					},
				})
			case session.EventRendered:
				err = webSocketSendJSON(ctx, ws, Message{
					Event: "rendered",
				})
			}
			if err != nil {
				sr.logger.Error("failed to send a message over websocket", slog.Any("error", err))
				cancel()
				return
			}
		}
	}()
	for {
		_, msg, err := ws.Read(ctx)
		if err != nil {
			sr.logger.Error("failed to read a message over websocket", slog.Any("error", err))
			cancel()
			return
		}
		var cmd struct {
			Command string            `json:"cmd"`
			Args    jsonv1.RawMessage `json:"args"`
		}
		if err := json.Unmarshal(msg, &cmd); err != nil {
			if _, ok := errors.AsType[*json.SemanticError](err); ok {
				sr.logger.Info("received an invalid command over websocket", slog.Any("error", err))
			} else if _, ok := errors.AsType[*jsontext.SyntacticError](err); ok {
				sr.logger.Info("received an invalid command over websocket", slog.Any("error", err))
			} else {
				sr.logger.Error("failed to parse a command received over websocket", slog.Any("error", err))
			}
			cancel()
			return
		}
		var cmderr error
		switch cmd.Command {
		case "takeRole":
			var args struct {
				RoleID string `json:"roleID"`
			}
			if cmderr = json.Unmarshal(cmd.Args, &args); cmderr != nil {
				break
			}
			cmderr = conn.TakeRole(ctx, args.RoleID)
		case "releaseRole":
			var args struct {
				RoleID string `json:"roleID"`
			}
			if cmderr = json.Unmarshal(cmd.Args, &args); cmderr != nil {
				break
			}
			cmderr = conn.ReleaseRole(ctx, args.RoleID)
		case "switchToRolePicking":
			cmderr = conn.SwitchToRolePicking(ctx)
		case "switchToSegmentsVoicing":
			cmderr = conn.SwitchToSegmentsVoicing(ctx)
		case "kick":
			var args struct {
				UserID string `json:"userID"`
			}
			if cmderr = json.Unmarshal(cmd.Args, &args); cmderr != nil {
				break
			}
			cmderr = conn.KickParticipant(ctx, args.UserID)
		case "done":
			cmderr = conn.Done(ctx)
		case "recordingUploadURL":
			// TODO.
		}
		if cmderr != nil {
			sr.logger.Info("failed to execute command", slog.Any("error", cmderr))
			cancel()
			return
		}
	}
}

func (sr *SessionsRouter) CreateSession(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	clipID := r.URL.Query().Get("clip")
	if clipID == "" {
		http.Error(w, "clip id not provided", http.StatusBadRequest)
		return
	}
	session, err := sr.service.CreateSession(r.Context(), session.CreateSessionParams{
		HostID: user.ID,
		ClipID: clipID,
	})
	if err != nil {
		if errors.Is(err, clip.ErrNotFound) {
			http.Error(w, "clip not found", http.StatusBadRequest)
			return
		}
		sr.logger.Error("failed to create session", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	if err := json.MarshalWrite(w, session, jsonv1.FormatDurationAsNano(true)); err != nil {
		sr.logger.Error("failed to json marshal and send session", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (sr *SessionsRouter) GetSession(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	sessionID := chi.URLParam(r, "sessionID")
	if sessionID == "" {
		http.Error(w, "session id not provided", http.StatusBadRequest)
		return
	}
	s, err := sr.service.GetSession(r.Context(), session.GetSessionParams{
		UserID:    user.ID,
		SessionID: sessionID,
	})
	if err != nil {
		if errors.Is(err, session.ErrNotFound) {
			http.Error(w, "session not found", http.StatusNotFound)
			return
		}
		sr.logger.Error("failed to get session", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.MarshalWrite(w, s, jsonv1.FormatDurationAsNano(true)); err != nil {
		sr.logger.Error("failed to json marshal and send session", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (sr *SessionsRouter) DownloadSessionRender(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	sessionID := chi.URLParam(r, "sessionID")
	if sessionID == "" {
		http.Error(w, "session id not provided", http.StatusBadRequest)
		return
	}
	u, err := sr.service.GetSessionRenderDownloadURL(r.Context(), session.GetSessionRenderDownloadURLParams{
		UserID:    user.ID,
		SessionID: sessionID,
	})
	if err != nil {
		if errors.Is(err, session.ErrNotFound) || errors.Is(err, session.ErrNotParticipant) {
			http.Error(w, "session not found", http.StatusNotFound)
			return
		}
		sr.logger.Error("failed to get session's render download url", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	out := struct {
		URL string `json:"url"`
	}{
		URL: u.String(),
	}
	if err := json.MarshalWrite(w, out); err != nil {
		sr.logger.Error("failed to json marshal and send download url", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (sr *SessionsRouter) GetUserSessions(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	sessions, err := sr.service.GetUserSessions(r.Context(), user.ID)
	if err != nil {
		sr.logger.Error("failed to get user sessions", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	out := struct {
		Sessions []session.Session `json:"sessions"`
	}{
		Sessions: sessions,
	}
	if err := json.MarshalWrite(w, out, jsonv1.FormatDurationAsNano(true)); err != nil {
		sr.logger.Error("failed to json marshal and send user sessions", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
