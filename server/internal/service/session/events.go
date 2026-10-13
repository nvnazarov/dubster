package session

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

type EventUserDone struct {
	UserID string
}

type EventRolePickingState struct{}

type EventSegmentsVoicingState struct{}

type EventFinalizingState struct{}

type EventGraded struct {
	Grades map[string]float64
}

type EventRendered struct{}
