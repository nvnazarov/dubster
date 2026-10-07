package clip

import "context"

type NotifyUploaded struct {
	clips Repository
}

type NotifyUploadedParams struct {
	UserID string
	ClipID string
}

func (s *NotifyUploaded) Execute(ctx context.Context, p NotifyUploadedParams) error {
	clip, err := s.clips.Get(ctx, p.ClipID)
	if err != nil {
		return err
	}
	if clip.AuthorID != p.UserID {
		return ErrNotOwned
	}
	// TODO
	return nil
}
