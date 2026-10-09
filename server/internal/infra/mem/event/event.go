package event

import (
	"context"
	"log"
	"sync"

	"github.com/nvnazarov/dubster/server/internal/misc/event"
)

const bufferSize = 64

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
		q.logger.Printf("events queue: creating queue for key: %v\n", key)
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
	logger *log.Logger
}

func (p *publisher[T]) Publish(ctx context.Context, event T) error {
	p.queue.cond.L.Lock()
	defer p.queue.cond.L.Unlock()
	p.queue.buf[p.queue.index%len(p.queue.buf)] = event
	p.queue.index += 1
	p.queue.cond.Broadcast()
	p.logger.Print("events queue[%v]: published event: %+v\n", p.queue.key, event)
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
	logger *log.Logger
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
			c.logger.Printf("events queue[%v]: skipping overwritten events", c.queue.key)
			c.index = c.queue.index - len(c.queue.buf)
		}
		event := c.queue.buf[c.index%len(c.queue.buf)]
		c.index += 1
		if casted, ok := event.(T); ok {
			c.logger.Printf("events queue[%v]: consumed event: %+v\n", c.queue.key, event)
			return casted, nil
		}
		c.logger.Printf("events queue[%v]: corrupted event: %+v\n", c.queue.key, event)
	}
}

func Consumer[T any](q *Queue, key Key) event.Consumer[T] {
	q.ensure(key)
	return &consumer[T]{
		queue:  q.queues[key],
		logger: q.logger,
	}
}
