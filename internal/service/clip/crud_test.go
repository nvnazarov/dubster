package clip

import (
	"context"
	"errors"
	"testing"
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

func TestDeleteClip_ChecksClipOwnership(t *testing.T) {
	db := FakeRepository{
		clips: map[string]Clip{
			"1": Clip{AuthorID: "1"},
		},
	}
	crud := NewCRUD(db)
	err := crud.Delete(context.Background(), DeleteParams{UserID: "2", ClipID: "1"})
	if !errors.Is(err, ErrNotOwned) {
		t.Fatalf("returned error is not ErrNotOwned: %v", err)
	}
	if _, ok := db.clips["1"]; !ok {
		t.Fatalf("not owned clip is deleted")
	}
}

func TestDeleteClip_DeletesClip(t *testing.T) {
	db := FakeRepository{
		clips: map[string]Clip{
			"1": Clip{AuthorID: "1"},
		},
	}
	crud := NewCRUD(db)
	err := crud.Delete(context.Background(), DeleteParams{UserID: "1", ClipID: "1"})
	if err != nil {
		t.Fatalf("returned error is not nil: %v", err)
	}
	if _, ok := db.clips["1"]; ok {
		t.Fatalf("clip is not deleted")
	}
}
