package command

import (
	"context"
	"errors"
	"log/slog"
	"sync"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/command"
)

const bufferSize = 16

var ErrBufferOverflow = errors.New("buffer overflow")

type Key string

type Queue struct {
	queues map[Key]*queue
	logger *slog.Logger
	mu     *sync.Mutex
}

func NewQueue(logger *slog.Logger) *Queue {
	return &Queue{
		queues: map[Key]*queue{},
		logger: logger,
		mu:     &sync.Mutex{},
	}
}

func (q *Queue) ensure(key Key) {
	q.mu.Lock()
	defer q.mu.Unlock()
	if _, ok := q.queues[key]; !ok {
		q.logger.Debug("command queue: creating queue for key", slog.String("key", string(key)))
		q.queues[key] = &queue{commands: make(chan any, bufferSize)}
	}
}

type queue struct {
	key      Key
	commands chan any
}

type dispatcher[T any] struct {
	queue  *queue
	logger *slog.Logger
}

func (d *dispatcher[T]) Dispatch(ctx context.Context, command T) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(2 * time.Second):
		return ErrBufferOverflow
	case d.queue.commands <- command:
		d.logger.Debug("command queue: queued a command",
			slog.String("key", string(d.queue.key)),
			slog.Any("cmd", command),
		)
		return nil
	}
}

func Dispatcher[T any](q *Queue, key Key) command.Dispatcher[T] {
	q.ensure(key)
	return &dispatcher[T]{
		queue:  q.queues[key],
		logger: q.logger,
	}
}

type cmd[T any] struct {
	data  T
	queue *queue
}

func (c *cmd[T]) Data() T {
	return c.data
}

func (c *cmd[T]) Commit(ctx context.Context) error {
	return nil
}

func (c *cmd[T]) Rollback(ctx context.Context) error {
	// TODO: put command into dead letter queue (DLQ).
	return nil
}

type handler[T any] struct {
	queue  *queue
	logger *slog.Logger
}

func (h *handler[T]) Handle(ctx context.Context) (command.Command[T], error) {
	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case c := <-h.queue.commands:
			if casted, ok := c.(T); ok {
				h.logger.Debug("command queue: dispatched a command",
					slog.String("key", string(h.queue.key)),
					slog.Any("cmd", casted),
				)
				return &cmd[T]{data: casted, queue: h.queue}, nil
			} else {
				h.logger.Error("command queue: command corrupted",
					slog.String("key", string(h.queue.key)),
					slog.Any("cmd", c),
				)
			}
		}
	}
}

func Handler[T any](q *Queue, key Key) command.Handler[T] {
	q.ensure(key)
	return &handler[T]{
		queue:  q.queues[key],
		logger: q.logger,
	}
}
