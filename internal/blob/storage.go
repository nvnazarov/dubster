package blob

import (
	"context"
	"errors"
	"io"
	"net/url"
)

var (
	ErrNotFound = errors.New("blob not found")
)

type OpenReader interface {
	OpenRead(ctx context.Context, id string) (io.ReadCloser, error)
}

type OpenWriter interface {
	OpenWrite(ctx context.Context, id string) (io.WriteCloser, error)
}

type Storage interface {
	OpenReader
	OpenWriter
}

type Uploader interface {
	UploadURL(ctx context.Context, id string) (url.URL, error)
}

type Downloader interface {
	DownloadURL(ctx context.Context, id string) (url.URL, error)
}
