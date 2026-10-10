package api

import (
	"encoding/json/jsontext"
	"encoding/json/v2"
	"errors"
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/nvnazarov/dubster/server/internal/misc/blob"
	"github.com/nvnazarov/dubster/server/internal/service/clip"
)

type ClipsRouter struct {
	chi.Router
	crud         *clip.CRUD
	store        *clip.Store
	verification *clip.Verification
	logger       *slog.Logger
}

type ClipsRouterDependencies struct {
	CRUD         *clip.CRUD
	Store        *clip.Store
	Verification *clip.Verification
	Logger       *slog.Logger
}

func NewClipsRouter(d ClipsRouterDependencies) ClipsRouter {
	chiRouter := chi.NewRouter()
	r := ClipsRouter{
		chiRouter,
		d.CRUD,
		d.Store,
		d.Verification,
		d.Logger,
	}
	r.Get("/{clipID}", r.GetClip)
	r.With(Authenticate).Post("/", r.CreateClip)
	r.With(Authenticate).Delete("/{clipID}", r.DeleteClip)
	r.With(Authenticate).Get("/{clipID}/upload-url", r.GetClipUploadURL)
	r.With(Authenticate).Post("/{clipID}/verify", r.VerifyClip)
	r.Get("/{clipID}/download-url", r.GetClipDownloadURL)
	return r
}

func (cr *ClipsRouter) GetClip(w http.ResponseWriter, r *http.Request) {
	clipID := chi.URLParam(r, "clipID")
	c, err := cr.crud.Get(r.Context(), clipID)
	if err != nil {
		if errors.Is(err, clip.ErrNotFound) {
			http.Error(w, "clip not found", http.StatusNotFound)
			return
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
	if err := json.MarshalWrite(w, c); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (cr *ClipsRouter) DeleteClip(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	clipID := chi.URLParam(r, "clipID")
	err := cr.crud.Delete(r.Context(), clip.DeleteParams{UserID: user.ID, ClipID: clipID})
	if err != nil {
		if errors.Is(err, clip.ErrNotFound) {
			http.Error(w, "clip not found", http.StatusNotFound)
			return
		} else {
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
	w.WriteHeader(http.StatusNoContent)
}

func (cr *ClipsRouter) CreateClip(w http.ResponseWriter, r *http.Request) {
	var body struct {
		ClipID      string                  `json:"id"`
		Title       string                  `json:"title"`
		Description string                  `json:"description"`
		Segments    map[string]clip.Segment `json:"segments"`
		Roles       map[string]clip.Role    `json:"roles"`
	}
	if err := json.UnmarshalRead(r.Body, &body); err != nil {
		if err, ok := errors.AsType[*json.SemanticError](err); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if _, ok := errors.AsType[*jsontext.SyntacticError](err); ok {
			http.Error(w, "no body", http.StatusBadRequest)
			return
		}
		cr.logger.Error("create clip: parse body: fail", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	user := UserFromContext(r.Context())
	c, err := cr.crud.Create(r.Context(), clip.CreateParams{
		UserID:      user.ID,
		ClipID:      body.ClipID,
		Title:       body.Title,
		Description: body.Description,
		Segments:    body.Segments,
		Roles:       body.Roles,
	})
	if err != nil {
		if err, ok := errors.AsType[clip.InvalidParams](err); ok {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	if err := json.MarshalWrite(w, c); err != nil {
		cr.logger.Error("create clip: failed to return response", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (cr *ClipsRouter) GetClipUploadURL(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	clipID := chi.URLParam(r, "clipID")
	url, err := cr.store.UploadURL(r.Context(), clip.StoreUploadURLParams{
		UserID: user.ID,
		ClipID: clipID,
	})
	if err != nil {
		switch {
		case errors.Is(err, clip.ErrNotFound):
			http.Error(w, "clip not found", http.StatusNotFound)
			return
		case errors.Is(err, clip.ErrNotOwned):
			http.Error(w, "clip not owned", http.StatusUnauthorized)
			return
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
	out := struct {
		URL string `json:"url"`
	}{
		URL: url.String(),
	}
	if err := json.MarshalWrite(w, out); err != nil {
		cr.logger.Error("get clip upload url: failed to return response", slog.Any("error", err))
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
}

func (cr *ClipsRouter) VerifyClip(w http.ResponseWriter, r *http.Request) {
	user := UserFromContext(r.Context())
	clipID := chi.URLParam(r, "clipID")
	if err := cr.verification.Execute(r.Context(), clip.VerificationParams{
		UserID: user.ID,
		ClipID: clipID,
	}); err != nil {
		http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (cr *ClipsRouter) GetClipDownloadURL(w http.ResponseWriter, r *http.Request) {
	clipID := chi.URLParam(r, "clipID")
	url, err := cr.store.DownloadURL(r.Context(), clipID)
	if err != nil {
		switch {
		case errors.Is(err, blob.ErrNotFound):
			http.Error(w, "clip not found", http.StatusNotFound)
			return
		default:
			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
			return
		}
	}
	w.WriteHeader(http.StatusTemporaryRedirect)
	w.Header().Add("Location", url.String())
}
