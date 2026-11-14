package retry

import (
	"context"
	"time"
)

const (
	DefaultExponentStart   = time.Second
	DefaultExponentCap     = 5 * time.Minute
	DefaultExponentPower   = 2
	DefaultExponentTimes   = 3
	DefaultExponentTimeout = 5 * time.Minute
)

type exponentPolicyBuilder struct {
	start   time.Duration
	cap     time.Duration
	power   float64
	times   int
	timeout time.Duration
}

type exponentPolicy struct {
	ctx     context.Context
	start   time.Duration
	cap     time.Duration
	power   float64
	times   int
	timeout time.Duration
}

type exponentExecutor struct {
	ok      bool
	stopped bool
	errors  []error
	ctx     context.Context
	delay   time.Duration
	cap     time.Duration
	power   float64
	times   int
	timeout time.Duration
}

func (r *exponentExecutor) Ok() bool {
	return r.ok
}

func (r *exponentExecutor) Errors() []error {
	return r.errors
}

func Exponent() *exponentPolicyBuilder {
	return &exponentPolicyBuilder{
		start:   DefaultExponentStart,
		cap:     DefaultExponentCap,
		power:   DefaultExponentPower,
		times:   DefaultExponentTimes,
		timeout: DefaultExponentTimeout,
	}
}

func (p *exponentPolicyBuilder) Start(start time.Duration) *exponentPolicyBuilder {
	p.start = start
	return p
}

func (p *exponentPolicyBuilder) Cap(cap time.Duration) *exponentPolicyBuilder {
	p.cap = cap
	return p
}

func (p *exponentPolicyBuilder) Power(power float64) *exponentPolicyBuilder {
	p.power = power
	return p
}

func (p *exponentPolicyBuilder) Retry(times int) *exponentPolicyBuilder {
	p.times = times
	return p
}

func (p *exponentPolicyBuilder) Timeout(timeout time.Duration) *exponentPolicyBuilder {
	p.timeout = timeout
	return p
}

func (p *exponentPolicyBuilder) Build() Policy {
	if p.start > p.cap {
		panic("start > cap")
	}
	if p.power < 1 {
		panic("power < 1")
	}
	if p.times < 1 {
		panic("times < 1")
	}
	return &exponentPolicy{
		ctx:     context.Background(),
		start:   p.start,
		cap:     p.cap,
		power:   p.power,
		times:   p.times,
		timeout: p.timeout,
	}
}

func (p *exponentPolicy) WithContext(ctx context.Context) policyWithContext {
	return &exponentPolicy{
		ctx:     ctx,
		start:   p.start,
		cap:     p.cap,
		power:   p.power,
		times:   p.times,
		timeout: p.timeout,
	}
}

func (r *exponentPolicy) Do(fn func(ctx context.Context) Next) Result {
	exe := &exponentExecutor{
		ok:      false,
		stopped: false,
		errors:  nil,
		ctx:     r.ctx,
		delay:   r.start,
		cap:     r.cap,
		power:   r.power,
		times:   r.times,
		timeout: r.timeout,
	}
	return exe.run(fn)
}

func (exe *exponentExecutor) run(fn func(ctx context.Context) Next) Result {
	for range exe.times {
		op := exe.do(fn)
		if op == nil {
			exe.ok = true
			break
		}
		op.step(exe)
		if exe.stopped {
			break
		}
		exe.wait()
		if exe.stopped {
			break
		}
	}
	return exe
}

func (exe *exponentExecutor) do(fn func(ctx context.Context) Next) Next {
	ctx, cancel := context.WithTimeout(exe.ctx, exe.timeout)
	defer cancel()
	return fn(ctx)
}

func (exe *exponentExecutor) fail(err error) {
	exe.errors = append(exe.errors, err)
}

func (exe *exponentExecutor) stop() {
	exe.stopped = true
}

func (exe *exponentExecutor) wait() {
	select {
	case <-exe.ctx.Done():
		exe.stopped = true
	case <-time.After(exe.delay):
		exp := int64(float64(exe.delay.Milliseconds()) * exe.power)
		delay := time.Duration(exp * 1000)
		exe.delay = min(delay, exe.cap)
	}
}
