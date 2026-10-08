package game

type EventRoleReleased struct {
	UserID string
	RoleID string
}

type EventRoleTaken struct {
	UserID string
	RoleID string
}

type EventUserConnected struct {
	UserID string
}

type EventUserDisconnected struct {
	UserID string
}

type EventUserKicked struct {
	UserID string
}

type EventUserFinished struct {
	UserID string
}

type EventGameStarted struct{}

type EventGameFinished struct{}

type EventGraded struct {
	Grades map[string]float64
}

type EventRendered struct{}
