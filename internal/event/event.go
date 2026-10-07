package event

import "context"

// Consumer abstracts a consumer of a specific event.
type Consumer[T any] interface {
	// Consume waits for the next event to occur and
	// returns it to the caller.
	Consume(ctx context.Context) (T, error)
}

// Publisher abstracts a publisher of a specific event.
type Publisher[T any] interface {
	// Publish emits the event for others to consume.
	Publish(ctx context.Context, event T) error
}
