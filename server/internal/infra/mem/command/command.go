package command

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/command"
)

const bufferSize = 16

var ErrBufferOverflow = errors.New("buffer overflow")

type Key string

type Queue struct {
	queues map[Key]*queue
	logger *log.Logger
	mu     *sync.Mutex
}

func NewQueue(logger *log.Logger) *Queue {
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
		q.logger.Printf("command queue: creating queue for key: %v\n", key)
		q.queues[key] = &queue{commands: make(chan any, bufferSize)}
	}
}

type queue struct {
	key      Key
	commands chan any
}

type dispatcher[T any] struct {
	queue  *queue
	logger *log.Logger
}

func (d *dispatcher[T]) Dispatch(ctx context.Context, command T) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-time.After(2 * time.Second):
		return ErrBufferOverflow
	case d.queue.commands <- command:
		d.logger.Printf("command queue[%v]: queued command: %+v\n", d.queue.key, command)
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
	logger *log.Logger
}

func (h *handler[T]) Handle(ctx context.Context) (command.Command[T], error) {
	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case c := <-h.queue.commands:
			if casted, ok := c.(T); ok {
				h.logger.Println("command queue[%v]: dispatched command: %+v", h.queue.key, casted)
				return &cmd[T]{data: casted, queue: h.queue}, nil
			} else {
				h.logger.Println("command queue[%v]: corrupted command: %+v", h.queue.key, c)
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
