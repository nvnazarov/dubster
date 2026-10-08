package game

import "errors"

var (
	ErrNotHost        = errors.New("not host")
	ErrNotParticipant = errors.New("not participant")
	ErrRoleOccupied   = errors.New("role occupied")
	ErrNotRoleActor   = errors.New("not role actor")
	ErrNoSuchSegment  = errors.New("no such segment")
	ErrHostKick       = errors.New("host kick")
	ErrFinished       = errors.New("user finished")
	ErrState          = errors.New("bad operation in current game state")
)
