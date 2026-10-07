package clip

import (
	"context"
)

type FakeRepository struct {
	clips map[string]Clip
}

func (m FakeRepository) Save(ctx context.Context, clip Clip) error {
	m.clips[clip.ID] = clip
	return nil
}

func (m FakeRepository) Delete(ctx context.Context, clipID string) error {
	if _, ok := m.clips[clipID]; ok {
		delete(m.clips, clipID)
		return nil
	}
	return ErrNotFound
}

func (m FakeRepository) Get(ctx context.Context, clipID string) (Clip, error) {
	if clip, ok := m.clips[clipID]; ok {
		return clip, nil
	}
	return Clip{}, ErrNotFound
}

func (m FakeRepository) Commit(ctx context.Context) error {
	return nil
}

func (m FakeRepository) Rollback(ctx context.Context) error {
	return nil
}

func (m FakeRepository) BeginTx(ctx context.Context) (Tx, error) {
	return m, nil
}
