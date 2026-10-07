package clip

// import (
// 	"bytes"
// 	"context"
// 	"errors"
// 	"io"
// 	"io/fs"
// 	"time"

// 	"github.com/abema/go-mp4"
// )

// const (
// 	MaxSizeBytes = 200 << 20
// 	MaxDuration  = 2 * time.Minute
// 	MaxSegments  = 100
// 	MaxRoles     = 20
// )

// // VerificationError signifies that verified clip is invalid.
// type VerificationError error

// var (
// 	ErrTooBig           VerificationError = errors.New("file is too big")
// 	ErrNotAVideo        VerificationError = errors.New("file is not a video")
// 	ErrTooLong          VerificationError = errors.New("clip is too long")
// 	ErrClipFileMismatch VerificationError = errors.New("clip metadata and file do not match")
// 	ErrInvalidSegment   VerificationError = errors.New("invalid segment")
// 	ErrUnusedRole       VerificationError = errors.New("unused role")
// 	ErrUnknownRole      VerificationError = errors.New("unknow role")
// 	ErrTooManySegments  VerificationError = errors.New("too many segments")
// 	ErrNoSegments       VerificationError = errors.New("no segments")
// )

// type VideoFormat string

// const (
// 	UnknownFormat VideoFormat = ""
// 	MP4           VideoFormat = "mp4"
// )

// type VideoInfo struct {
// 	SizeBytes int
// 	Duration  time.Duration
// 	Format    VideoFormat
// }

// // Verifier is a struct with a single method whose purpose is
// // to verify that a given clip is valid. See [Verifier.Verify].
// // The fields [Verifier.events] and [Verifier.clips] may be
// // bonded (e.g. outbox pattern) or not, but this is up to the
// // process which constructs the Verifier.
// type Verifier struct {
// 	files  fs.FS
// 	clips  Repository
// }

// // NewVerifier constructs a new [Verifier].
// func NewVerifier(files fs.FS, clips Repository) Verifier {
// 	return Verifier{
// 		files:  files,
// 		clips:  clips,
// 	}
// }

// // Verify verifies that the clip is valid. For safety reasons, every
// // clip uploaded by a user should be verified so that it will not
// // harm other users. Verification status is stored in [Repository].
// // After verifying, an [events.ClipVerified] event is published.
// // An error is returned only if the verification process itself failed.
// func (v *Verifier) Verify(ctx context.Context, clipID string) error {
// 	clip, err := v.clips.Get(ctx, clipID)
// 	if err != nil {
// 		return err
// 	}
// 	if err := v.verify(clip); err != nil {
// 		if _, ok := errors.AsType[VerificationError](err); !ok {
// 			return err
// 		}
// 		clip.MarkInvalid()
// 		err = v.clips.Save(ctx, clip)
// 		if err != nil {
// 			return err
// 		}
// 		return v.events.Publish(ctx, events.ClipVerified{ClipID: clipID, Valid: false})
// 	}
// 	clip.MarkValid()
// 	err = v.clips.Save(ctx, clip)
// 	if err != nil {
// 		return err
// 	}
// 	return v.events.Publish(ctx, events.ClipVerified{ClipID: clipID, Valid: true})
// }

// // verify returns [VerificationError] only if the clip or
// // corresponding video file is invalid.
// func (v *Verifier) verify(clip Clip) error {
// 	// Before reading the video file, check the provided [Clip].
// 	if err := clip.Verify(); err != nil {
// 		return err
// 	}
// 	// Verify video file.
// 	file, err := v.files.Open(clip.FilePath())
// 	if err != nil {
// 		return err
// 	}
// 	defer file.Close()
// 	videoInfo, err := analyzeVideoFile(io.LimitReader(file, MaxSizeBytes+1))
// 	if err != nil {
// 		return ErrNotAVideo
// 	}
// 	switch {
// 	case videoInfo.SizeBytes > MaxSizeBytes:
// 		return ErrTooBig
// 	case videoInfo.Duration > MaxDuration:
// 		return ErrTooLong
// 	case clip.Duration != videoInfo.Duration, clip.SizeBytes != videoInfo.SizeBytes:
// 		return ErrClipFileMismatch
// 	}
// 	return nil
// }

// // analyzeVideoFile analyzes the video file (it reads and stores
// // full file in memory) and returns its stats (see [VideoInfo]).
// func analyzeVideoFile(file io.Reader) (VideoInfo, error) {
// 	var info VideoInfo
// 	fileBytes, err := io.ReadAll(file)
// 	if err != nil {
// 		return info, err
// 	}
// 	info.SizeBytes = len(fileBytes)
// 	fileInfo, err := mp4.Probe(bytes.NewReader(fileBytes))
// 	if err != nil {
// 		return info, err
// 	}
// 	info.Duration = time.Duration(fileInfo.Duration * 1e6)
// 	info.Format = MP4
// 	return info, err
// }
