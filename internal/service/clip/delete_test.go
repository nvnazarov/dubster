package clip

import (
	"context"
	"errors"
	"testing"
)

func TestDeleteClip_ChecksClipOwnership(t *testing.T) {
	db := FakeRepository{
		clips: map[string]Clip{
			"1": Clip{AuthorID: "1"},
		},
	}
	s := NewDelete(db)
	err := s.Execute(context.Background(), DeleteParams{UserID: "2", ClipID: "1"})
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
	s := NewDelete(db)
	err := s.Execute(context.Background(), DeleteParams{UserID: "1", ClipID: "1"})
	if err != nil {
		t.Fatalf("returned error is not nil: %v", err)
	}
	if _, ok := db.clips["1"]; ok {
		t.Fatalf("clip is not deleted")
	}
}
