package event

import (
	"context"
	"log/slog"
	"sync"

	"github.com/nvnazarov/dubster/server/internal/misc/event"
)

const bufferSize = 64

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
		q.logger.Debug("events queue: creating queue for key", slog.String("key", string(key)))
		q.queues[key] = &queue{
			key:  key,
			buf:  make([]any, bufferSize),
			mu:   &sync.Mutex{},
			cond: sync.NewCond(&sync.Mutex{}),
		}
	}
}

type queue struct {
	key   Key
	buf   []any
	index int
	mu    *sync.Mutex
	cond  *sync.Cond
}

type publisher[T any] struct {
	queue  *queue
	logger *slog.Logger
}

func (p *publisher[T]) Publish(ctx context.Context, event T) error {
	p.queue.cond.L.Lock()
	defer p.queue.cond.L.Unlock()
	p.queue.buf[p.queue.index%len(p.queue.buf)] = event
	p.queue.index += 1
	p.queue.cond.Broadcast()
	p.logger.Debug("events queue: published an event",
		slog.String("key", string(p.queue.key)),
		slog.Any("event", event),
	)
	return nil
}

func Publisher[T any](q *Queue, key Key) event.Publisher[T] {
	q.ensure(key)
	return &publisher[T]{
		queue:  q.queues[key],
		logger: q.logger,
	}
}

type consumer[T any] struct {
	index  int
	queue  *queue
	logger *slog.Logger
}

func (c *consumer[T]) Consume(ctx context.Context) (T, error) {
	stop := context.AfterFunc(ctx, func() {
		c.queue.cond.L.Lock()
		defer c.queue.cond.L.Unlock()
		c.queue.cond.Broadcast()
	})
	defer stop()
	c.queue.cond.L.Lock()
	defer c.queue.cond.L.Unlock()
	for {
		if ctx.Err() != nil {
			var dummy T
			return dummy, ctx.Err()
		}
		for c.index >= c.queue.index {
			c.queue.cond.Wait()
			if ctx.Err() != nil {
				var dummy T
				return dummy, ctx.Err()
			}
		}
		if c.index+len(c.queue.buf) < c.queue.index {
			c.logger.Warn("events queue: skipping overwritten events", slog.String("key", string(c.queue.key)))
			c.index = c.queue.index - len(c.queue.buf)
		}
		event := c.queue.buf[c.index%len(c.queue.buf)]
		c.index += 1
		if casted, ok := event.(T); ok {
			c.logger.Debug("events queue: consumed an event",
				slog.String("key", string(c.queue.key)),
				slog.Any("event", event),
			)
			return casted, nil
		}
		c.logger.Error("events queue: corrupted event",
			slog.String("key", string(c.queue.key)),
			slog.Any("event", event),
		)
	}
}

func Consumer[T any](q *Queue, key Key) event.Consumer[T] {
	q.ensure(key)
	return &consumer[T]{
		queue:  q.queues[key],
		logger: q.logger,
	}
}
