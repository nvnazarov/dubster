// Package api provides Dubster HTTP API version 1.
package api

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

type Options struct {
	Address            string
	Library            LibraryRouter
	Clips              ClipsRouter
	Sessions           SessionsRouter
	CORSAllowedOrigins []string
	Logger             *slog.Logger
}

func ListenAndServe(o Options) error {
	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedOrigins:   o.CORSAllowedOrigins,
	}))
	r.With(Log(o.Logger)).Route("/api/v1", func(r chi.Router) {
		r.Mount("/library", o.Library)
		r.Mount("/clips", o.Clips)
		r.Mount("/sessions", o.Sessions)
	})
	s := http.Server{
		Addr:    o.Address,
		Handler: r,
	}
	return s.ListenAndServe()
}
