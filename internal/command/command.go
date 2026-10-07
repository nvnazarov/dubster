package command

import "context"

// Dispatcher abstracts a (specific) command dispatcher.
type Dispatcher[T any] interface {
	Dispatch(ctx context.Context, command T) error
}

// Handler abstracts a (specific) command handler.
type Handler[T any] interface {
	// Handle waits for the next command and returns
	// it to the caller.
	Handle(ctx context.Context) (Command[T], error)
}

type Command[T any] interface {
	Data() T
	Commit(ctx context.Context) error
	Rollback(ctx context.Context) error
}
