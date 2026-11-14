package retry

import (
	"context"
)

// Result represents the result of executing a function according
// to a [Policy].
type Result interface {
	// Ok returns true if the function executed successfully.
	Ok() bool
	// Errors returns errors that caused retries.
	Errors() []error
}

type policyWithContext interface {
	// Do executes the function according to this [Policy].
	//
	// The function should return a status: [Fail] or nil.
	// [Fail] signifies a failure, while nil signifies a
	// successful execution.
	Do(fn func(ctx context.Context) Next) Result
}

// Policy defines retrying rules.
type Policy interface {
	policyWithContext

	// WithContext sets the [context.Context] that will be provided
	// to the [Policy.Do] method. It can be modified by the [Policy]
	// according to the retrying rules (e.g. a timeout can be added).
	WithContext(ctx context.Context) policyWithContext
}

type executor interface {
	fail(err error)
	stop()
}

type Next interface {
	step(executor executor)
}

type fail struct {
	err   error
	fatal bool
}

func Fail(err error) *fail {
	if err == nil {
		panic("err cannot be nil")
	}
	return &fail{err: err, fatal: false}
}

func (f *fail) Fatal() Next {
	f.fatal = true
	return f
}

func (f *fail) step(executor executor) {
	executor.fail(f.err)
	if f.fatal {
		executor.stop()
	}
}
