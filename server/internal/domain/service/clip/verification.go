package clip

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/abema/go-mp4"
	"github.com/nvnazarov/dubster/server/internal/domain/model/clip"
	"github.com/nvnazarov/dubster/server/internal/domain/model/verification"
	"github.com/nvnazarov/dubster/server/internal/misc/blob"
)

func Verify(ctx context.Context, clip clip.Clip, video blob.RemoteFile) (verification.Status, error) {
	if err := verifyClip(&clip); err != nil {
		return verification.StatusBad, nil
	}
	videoReader, err := video.Reader(ctx)
	if err != nil {
		return verification.StatusNone, fmt.Errorf("create video reader: %w", err)
	}
	videoBytes, err := io.ReadAll(io.LimitReader(videoReader, int64(verification.MaxVideoSize.B()+1)))
	if err != nil {
		return verification.StatusNone, fmt.Errorf("read video: %w", err)
	}
	status := verifyVideo(&clip, videoBytes)
	return status, nil
}

func verifyClip(clip *clip.Clip) error {
	switch {
	case clip.AuthorID == "":
		return errors.New("clip has no author")
	case len(clip.Title) < verification.MinTitleLength:
		return errors.New("clip title is too short")
	case len(clip.Title) > verification.MaxTitleLength:
		return errors.New("clip title is too long")
	case len(clip.Description) < verification.MinDescriptionLength:
		return errors.New("clip description is too short")
	case len(clip.Description) > verification.MaxDescriptionLength:
		return errors.New("clip description is too long")
	case len(clip.Segments) < verification.MinSegments:
		return errors.New("clip has to few segments")
	case len(clip.Segments) > verification.MaxSegments:
		return errors.New("clip has to many segments")
	case len(clip.Roles) < verification.MinRoles:
		return errors.New("clip has to few roles")
	case len(clip.Roles) > verification.MaxRoles:
		return errors.New("clip has to many roles")
	}
	usedRoles := make(map[string]struct{})
	for segmentID, segment := range clip.Segments {
		if segmentID != segment.ID {
			return errors.New("clip segments map is badly formed")
		}
		if err := verifySegment(&segment); err != nil {
			return err
		}
		if _, ok := clip.Roles[segment.RoleID]; !ok {
			return errors.New("clip segment references unknown role")
		}
		usedRoles[segment.RoleID] = struct{}{}
	}
	for roleID, role := range clip.Roles {
		if roleID != role.ID {
			return errors.New("clip roles map is badly formed")
		}
		if err := verifyRole(&role); err != nil {
			return err
		}
		if _, ok := usedRoles[role.ID]; !ok {
			return errors.New("clip role is unused")
		}
	}
	return nil
}

func verifySegment(segment *clip.Segment) error {
	if segment.End < segment.Begin {
		return errors.New("clip segment is invalid")
	}
	duration := time.Duration(segment.End.Nanoseconds() - segment.Begin.Nanoseconds())
	switch {
	case duration > verification.MaxSegmentDuration:
		return errors.New("clip segment is too long")
	case duration < verification.MinSegmentDuration:
		return errors.New("clip segment is too short")
	}
	lineLength := len(segment.Line)
	switch {
	case lineLength > verification.MaxLineLength:
		return errors.New("clip segment line is too long")
	case lineLength < verification.MinLineLength:
		return errors.New("clip segment line is too short")
	}
	return nil
}

func verifyRole(role *clip.Role) error {
	switch {
	case len(role.Name) < verification.MinRoleNameLength:
		return errors.New("clip role name is too short")
	case len(role.Name) > verification.MaxRoleNameLength:
		return errors.New("clip role name is too long")
	}
	return nil
}

func verifyVideo(clip *clip.Clip, video []byte) verification.Status {
	if len(video) > verification.MaxVideoSize.B() {
		return verification.StatusVideoTooBig
	}
	probe, err := mp4.Probe(bytes.NewReader(video))
	if err != nil {
		return verification.StatusVideoBadFormat
	}
	videoDuration := time.Duration(probe.Duration * 1e6)
	if videoDuration > verification.MaxVideoDuration {
		return verification.StatusVideoTooLong
	}
	if videoDuration < verification.MinVideoDuration {
		return verification.StatusVideoTooShort
	}
	for _, segment := range clip.Segments {
		if segment.End > videoDuration {
			return verification.StatusBad
		}
	}
	return verification.StatusOk
}
