package main

import (
	"log/slog"
	"os"
	"strings"
)

func createLogger(config *config) *slog.Logger {
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		AddSource: true,
		Level: func() slog.Leveler {
			switch strings.ToLower(config.Log.Level) {
			case "error":
				return slog.LevelError
			case "warn":
				return slog.LevelWarn
			case "info":
				return slog.LevelInfo
			case "debug":
				return slog.LevelDebug
			default:
				return slog.LevelInfo
			}
		}(),
	}))
}
