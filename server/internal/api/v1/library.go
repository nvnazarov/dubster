package api

import (
	"encoding/json/v2"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
	"github.com/nvnazarov/dubster/server/internal/service/library"
)

type LibraryRouter struct {
	chi.Router
	library library.Library
}

func NewLibraryRouter(library library.Library) LibraryRouter {
	chiRouter := chi.NewRouter()
	r := LibraryRouter{chiRouter, library}
	r.Get("/cursor", r.NewCursor)
	r.Get("/search", r.BatchAt)
	return r
}

func (lr *LibraryRouter) NewCursor(w http.ResponseWriter, r *http.Request) {
	var params library.SearchParams
	for k, v := range r.URL.Query() {
		if len(v) > 0 {
			switch k {
			case "title":
				params.Title = v[0]
			case "author":
				params.AuthorID = v[0]
			case "roles":
				if n, err := strconv.Atoi(v[0]); err == nil {
					params.NumberOfRoles = n
				}
			case "order":
				switch {
				case v[0] == "asc":
					params.Order = library.OrderRatingAsc
				case v[0] == "desc":
					params.Order = library.OrderRatingDesc
				}
			}
		}
	}
	cursor, err := lr.library.NewCursor(r.Context(), params)
	if err != nil {
		if err, ok := errors.AsType[library.InvalidParams](err); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	out := struct {
		Cursor string `json:"cursor"`
	}{
		Cursor: cursor,
	}
	if err := json.MarshalWrite(w, out); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (lr *LibraryRouter) BatchAt(w http.ResponseWriter, r *http.Request) {
	cursor := r.URL.Query().Get("cursor")
	if cursor == "" {
		http.Error(w, "query params: no cursor", http.StatusBadRequest)
		return
	}
	batch, err := lr.library.BatchAt(r.Context(), cursor)
	if err != nil {
		if err, ok := errors.AsType[library.InvalidParams](err); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	out := struct {
		Clips         []clip.Clip `json:"clips"`
		AdvanceCursor string      `json:"advanceCursor,omitempty"`
		RevertCursor  string      `json:"revertCursor,omitempty"`
	}{
		Clips:         batch.Clips,
		AdvanceCursor: batch.AdvanceCursor,
		RevertCursor:  batch.RevertCursor,
	}
	if err := json.MarshalWrite(w, out); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}
