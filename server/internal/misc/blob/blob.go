package blob

import (
	"context"
	"io"
	"net/url"
	"time"
)

type RemoteFolder interface {
	File(name string) RemoteFile
	Folder(name string) RemoteFolder
}

type RemoteFile interface {
	UploadURL(ctx context.Context, expiry time.Duration) (*url.URL, error)
	DownloadURL(ctx context.Context, expiry time.Duration) (*url.URL, error)
	Reader(ctx context.Context) (io.ReadCloser, error)
	Writer(ctx context.Context) (io.WriteCloser, error)
}
