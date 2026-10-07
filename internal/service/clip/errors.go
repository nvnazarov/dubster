package clip

import "errors"

var (
	ErrNotOwned = errors.New("the clip is not owned by the user")
	ErrNotFound = errors.New("")
)

type InvalidParams error
