package api

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/coder/websocket"
	"github.com/go-chi/chi/v5"
	"github.com/nvnazarov/dubster/server/internal/service/session/game"
)

type SessionsRouter struct {
	chi.Router
	hub game.Hub
}

func NewSessionsRouter(hub game.Hub) SessionsRouter {
	chiRouter := chi.NewRouter()
	r := SessionsRouter{chiRouter, hub}
	r.With(Authenticate).Post("/", r.CreateSession)
	r.With(Authenticate).Get("/{sessionID}", r.Connect)
	r.Get("/{sessionID}/download", r.DownloadRender)
	return r
}

func (cr *SessionsRouter) Connect(w http.ResponseWriter, r *http.Request) {
	ws, err := websocket.Accept(w, r, nil)
	if err != nil {
		return
	}
	defer ws.CloseNow()
	ctx := ws.CloseRead(r.Context())
	// user := UserFromContext(r.Context())
	sessionID := chi.URLParam(r, "sessionID")
	g, err := cr.hub.Get(sessionID)
	if err != nil {
		switch {
		case errors.Is(err, game.ErrNotFound):
			ws.Write(ctx, websocket.MessageText, []byte("session not found"))
			return
		default:
			ws.Write(ctx, websocket.MessageText, []byte("unknown error"))
			return
		}
	}
	go func() {
		events := g.Events(ctx)
		for event := range events {
			var err error
			switch event.(type) {
			case game.EventGameFinished:
				err = ws.Write(ctx, websocket.MessageText, []byte("finished"))
			case game.EventGameStarted:
				err = ws.Write(ctx, websocket.MessageText, []byte("started"))
			case game.EventRoleReleased:
				err = ws.Write(ctx, websocket.MessageText, []byte("released"))
			case game.EventRoleTaken:
				err = ws.Write(ctx, websocket.MessageText, []byte("taken"))
			case game.EventUserConnected:
				err = ws.Write(ctx, websocket.MessageText, []byte("connected"))
			case game.EventUserDisconnected:
				err = ws.Write(ctx, websocket.MessageText, []byte("disconnected"))
			case game.EventUserKicked:
				err = ws.Write(ctx, websocket.MessageText, []byte("kicked"))
			case game.EventGraded:
				err = ws.Write(ctx, websocket.MessageText, []byte("graded"))
			case game.EventRendered:
				err = ws.Write(ctx, websocket.MessageText, []byte("rendered"))
			}
			if err != nil {
				_ = ws.Write(ctx, websocket.MessageText, []byte("error"))
			}
		}
	}()
	for {
		readCtx, cancel := context.WithTimeout(ctx, 10*time.Minute)
		_, msg, err := ws.Read(readCtx)
		cancel()
		if err != nil {
			return
		}
		if err := ws.Write(ctx, websocket.MessageText, []byte(msg)); err != nil {
			return
		}
	}
}

func (cr *SessionsRouter) CreateSession(w http.ResponseWriter, r *http.Request) {
	cr.hub.Create("123")
	w.WriteHeader(http.StatusNoContent)
}

func (cr *SessionsRouter) DownloadRender(w http.ResponseWriter, r *http.Request) {

}

func (sr *SessionsRouter) MySessions(w http.ResponseWriter, r *http.Request) {

}
