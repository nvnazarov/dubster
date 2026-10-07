// Package api provides Dubster HTTP API version 1.
package api

import (
	"net/http"

	"github.com/go-chi/chi/v5"
)

type Routers struct {
	Library  LibraryRouter
	Clips    ClipsRouter
	Sessions SessionsRouter
}

func ListenAndServe(address string, routers Routers) error {
	r := chi.NewRouter()
	r.Route("/v1", func(r chi.Router) {
		r.Mount("/library", routers.Library)
		r.Mount("/clips", routers.Clips)
		r.Mount("/sessions", routers.Sessions)
	})
	s := http.Server{
		Addr:    address,
		Handler: r,
	}
	return s.ListenAndServe()
}
