package session

import "time"

// Session represents a session once it has started.
type Session struct {
	ID           string
	HostID       string
	ClipID       string
	Participants map[string]struct{}
	Actors       map[string]string
	Grades       map[string]float64
	Finished     bool
	Rendered     bool
	DateStarted  time.Time
	DateFinished time.Time
	DateGraded   time.Time
	DateRendered time.Time
}
