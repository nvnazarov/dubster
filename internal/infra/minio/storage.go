package minio

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/minio/minio-go/v7"
	"github.com/nvnazarov/dubster/internal/misc/size"
)

type Storage struct {
	client *minio.Client
	config Config
}

type Config struct {
	Endpoint          string
	Bucket            string
	MaxObjectSize     size.Size
	UploadURLExpiry   time.Duration
	DownloadURLExpiry time.Duration
}

func (c *Config) verify() error {
	if c.MaxObjectSize.B() <= 0 {
		return fmt.Errorf("storage config: invalid max object size: %v", c.MaxObjectSize)
	}
	return nil
}

func NewStorage(config Config) (Storage, error) {
	if err := config.verify(); err != nil {
		return Storage{}, err
	}
	client, err := minio.New(config.Endpoint, nil)
	if err != nil {
		return Storage{}, err
	}
	return Storage{
		client: client,
		config: config,
	}, nil
}

func (s Storage) OpenWrite(ctx context.Context, id string) (io.WriteCloser, error) {
	// TODO: implement.
	panic("not implemented")
}

func (s Storage) OpenRead(ctx context.Context, id string) (io.ReadCloser, error) {
	return s.client.GetObject(ctx, s.config.Bucket, id, minio.GetObjectOptions{})
}

func (s Storage) UploadURL(ctx context.Context, id string) (url.URL, error) {
	u, err := s.client.PresignedPutObject(ctx, s.config.Bucket, id, s.config.UploadURLExpiry)
	if err != nil {
		return url.URL{}, err
	}
	return *u, nil
}

func (s Storage) DownloadURL(ctx context.Context, id string) (url.URL, error) {
	u, err := s.client.PresignedGetObject(ctx, s.config.Bucket, id, s.config.DownloadURLExpiry, nil)
	if err != nil {
		return url.URL{}, err
	}
	return *u, nil
}
