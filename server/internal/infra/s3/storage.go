package s3

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/nvnazarov/dubster/server/internal/misc/size"
)

type Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient
	config        Config
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
	client := s3.New(s3.Options{BaseEndpoint: &config.Endpoint})
	presignClient := s3.NewPresignClient(client)
	return Storage{
		client:        client,
		presignClient: presignClient,
		config:        config,
	}, nil
}

func (s Storage) OpenWrite(ctx context.Context, id string) (io.WriteCloser, error) {
	// TODO: implement.
	panic("not implemented")
}

func (s Storage) OpenRead(ctx context.Context, id string) (io.ReadCloser, error) {
	output, err := s.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &s.config.Bucket,
		Key:    &id,
	})
	if err != nil {
		return nil, err
	}
	return output.Body, nil
}

func (s Storage) UploadURL(ctx context.Context, id string) (*url.URL, error) {
	output, err := s.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &s.config.Bucket,
		Key:    &id,
	})
	if err != nil {
		return nil, err
	}
	return url.Parse(output.URL)
}

func (s Storage) DownloadURL(ctx context.Context, id string) (*url.URL, error) {
	output, err := s.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &s.config.Bucket,
		Key:    &id,
	})
	if err != nil {
		return nil, err
	}
	return url.Parse(output.URL)
}
