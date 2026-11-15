package session

import "time"

type Phase int

const (
	PhaseLobby Phase = iota
	PhasePickingRoles
	PhaseDubbing
	PhaseRenderingAndGrading
	PhaseEnded
)

type Participants map[string]struct{}

type RolesActors map[string]string

type Grades map[string]float64

type Session struct {
	ID           string       `json:"id"`
	HostID       string       `json:"hostID"`
	ClipID       string       `json:"clipID"`
	Participants Participants `json:"participants"`
	RolesActors  RolesActors  `json:"rolesActors"`
	Grades       Grades       `json:"grades"`
	Phase        Phase        `json:"phase"`
	DateCreated  time.Time    `json:"dateCreated"`
	DateStarted  time.Time    `json:"dateStarted"`
	DateFinished time.Time    `json:"dateFinished"`
	DateGraded   time.Time    `json:"dateGraded"`
	DateRendered time.Time    `json:"dateRendered"`
}
