package api

import (
	"context"
	"log/slog"
	"net/http"
)

type User struct {
	ID string
}

type middlewareContextKey int

const (
	_ middlewareContextKey = iota
	userKey
)

func ContextWithUser(ctx context.Context, user User) context.Context {
	return context.WithValue(ctx, userKey, user)
}

func UserFromContext(ctx context.Context) User {
	return ctx.Value(userKey).(User)
}

func Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// TODO: implement authentication logic.
		ctx := ContextWithUser(r.Context(), User{ID: "0"})
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func Log(logger *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			next.ServeHTTP(w, r)
			logger.Debug("handled request",
				slog.String("method", r.Method),
				slog.String("uri", r.RequestURI),
			)
		})
	}
}
