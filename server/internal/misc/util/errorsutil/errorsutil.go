package errorsutil

import (
	"runtime/debug"
)

type DetailedError struct {
	Err   error
	Stack string
}

func (d DetailedError) Error() string {
	return d.Err.Error()
}

func WrapError(err error) DetailedError {
	return DetailedError{
		Err:   err,
		Stack: string(debug.Stack()),
	}
}
