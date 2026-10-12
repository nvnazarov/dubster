package api

import (
	"context"
	jsonv1 "encoding/json"
	"encoding/json/v2"
	"errors"
	"net/http"
	"time"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
	"github.com/nvnazarov/dubster/server/internal/service/session"
)

type SessionsRouter struct {
	chi.Router
	service *session.Service
}

func NewSessionsRouter(service *session.Service) SessionsRouter {
	chiRouter := chi.NewRouter()
	r := SessionsRouter{chiRouter, service}
	r.With(Authenticate).Post("/", r.CreateSession)
	r.With(Authenticate).Get("/my", r.GetUserSessions)
	r.With(Authenticate).Get("/{sessionID}", r.GetSession)
	r.With(Authenticate).Get("/{sessionID}/download", r.DownloadSessionRender)
	r.With(Authenticate).Get("/{sessionID}/connect", r.ConnectToSession)
	return r
}

func (sr *SessionsRouter) ConnectToSession(w http.ResponseWriter, r *http.Request) {
	ws, err := websocket.Accept(w, r, nil)
	if err != nil {
		return
	}
	defer ws.CloseNow()
	ctx := ws.CloseRead(r.Context())
	user := UserFromContext(r.Context())
	sessionID := chi.URLParam(r, "sessionID")
	conn, err := sr.service.ConnectToSession(ctx, session.ConnectToSessionParams{
		UserID:    user.ID,
		SessionID: sessionID,
	})
	if err != nil {
		switch {
		case errors.Is(err, session.ErrNotFound):
			ws.Write(ctx, websocket.MessageText, []byte("session not found"))
			return
		default:
			ws.Write(ctx, websocket.MessageText, []byte("unknown error"))
			return
		}
	}
	go func() {
		_, events := conn.Events(ctx)
		if err := ws.Write(ctx, websocket.MessageText, []byte("session state")); err != nil {
			// TODO: handle error.
		}
		for event := range events {
			var err error
			switch event.(type) {
			case session.EventRolePickingState:
				err = ws.Write(ctx, websocket.MessageText, []byte("role picking"))
			case session.EventSegmentsVoicingState:
				err = ws.Write(ctx, websocket.MessageText, []byte("segment voicing"))
			case session.EventRoleReleased:
				err = ws.Write(ctx, websocket.MessageText, []byte("released"))
			case session.EventRoleTaken:
				err = ws.Write(ctx, websocket.MessageText, []byte("taken"))
			case session.EventUserConnected:
				err = ws.Write(ctx, websocket.MessageText, []byte("connected"))
			case session.EventUserDisconnected:
				err = ws.Write(ctx, websocket.MessageText, []byte("disconnected"))
			case session.EventUserKicked:
				err = ws.Write(ctx, websocket.MessageText, []byte("kicked"))
			case session.EventUserDone:
				err = ws.Write(ctx, websocket.MessageText, []byte("user done"))
			case session.EventGraded:
				err = ws.Write(ctx, websocket.MessageText, []byte("graded"))
			case session.EventRendered:
				err = ws.Write(ctx, websocket.MessageText, []byte("rendered"))
			}
			if err != nil {
				// TODO: handle error.
			}
		}
	}()
	for {
		readCtx, cancel := context.WithTimeout(ctx, 30*time.Minute)
		_, msg, err := ws.Read(readCtx)
		cancel()
		if err != nil {
			// TODO: handle error.
			return
		}
		var cmd struct {
			Command string            `json:"cmd"`
			Args    jsonv1.RawMessage `json:"args"`
		}
		if err := json.Unmarshal(msg, &cmd); err != nil {
			// TODO: handle error.
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
			cmderr = conn.ReleaseRole(ctx, "")
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
			// TODO: handle error.
			return
		}
		if err := ws.Write(ctx, websocket.MessageText, []byte(msg)); err != nil {
			// TODO: handle error.
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
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.MarshalWrite(w, session, jsonv1.FormatDurationAsNano(true)); err != nil {
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
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.MarshalWrite(w, s, jsonv1.FormatDurationAsNano(true)); err != nil {
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
		if errors.Is(err, session.ErrNotFound) {
			http.Error(w, "session not found", http.StatusNotFound)
			return
		}
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	out := struct {
		URL string `json:"url"`
	}{
		URL: u.String(),
	}
	if err := json.MarshalWrite(w, out); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (sr *SessionsRouter) GetUserSessions(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	sessions, err := sr.service.GetUserSessions(r.Context(), user.ID)
	if err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	out := struct {
		Sessions []session.Session `json:"sessions"`
	}{
		Sessions: sessions,
	}
	if err := json.MarshalWrite(w, out, jsonv1.FormatDurationAsNano(true)); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
