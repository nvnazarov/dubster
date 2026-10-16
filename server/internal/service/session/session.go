package session

import "time"

type Session struct {
	ID           string              `json:"id"`
	HostID       string              `json:"hostID"`
	ClipID       string              `json:"clipID"`
	Participants map[string]struct{} `json:"participants"`
	Actors       map[string]string   `json:"actors"`
	Grades       map[string]float64  `json:"grades"`
	Finished     bool                `json:"finished"`
	Rendered     bool                `json:"rendered"`
	DateCreated  time.Time           `json:"dateCreated"`
	DateStarted  time.Time           `json:"dateStarted"`
	DateFinished time.Time           `json:"dateFinished"`
	DateGraded   time.Time           `json:"dateGraded"`
	DateRendered time.Time           `json:"dateRendered"`
}
