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

type Bucket struct {
	client         *s3.Client
	presignClient  *s3.PresignClient
	endpoint       string
	bucket         string
	uploadExpiry   time.Duration
	downloadExpiry time.Duration
}

type Options struct {
	Endpoint       string
	Bucket         string
	MaxObjectSize  size.Size
	UploadExpiry   time.Duration
	DownloadExpiry time.Duration
}

func (o *Options) verify() error {
	if o.MaxObjectSize.B() < 0 {
		return fmt.Errorf("new bucket: invalid option: max object size: %v", o.MaxObjectSize)
	}
	return nil
}

func NewBucket(options Options) (*Bucket, error) {
	if err := options.verify(); err != nil {
		return nil, err
	}
	client := s3.New(s3.Options{BaseEndpoint: &options.Endpoint})
	presignClient := s3.NewPresignClient(client)
	return &Bucket{
		client:         client,
		presignClient:  presignClient,
		endpoint:       options.Endpoint,
		bucket:         options.Bucket,
		uploadExpiry:   options.UploadExpiry,
		downloadExpiry: options.DownloadExpiry,
	}, nil
}

func (b *Bucket) OpenWrite(ctx context.Context, id string) (io.WriteCloser, error) {
	// TODO: implement.
	panic("not implemented")
}

func (b *Bucket) OpenRead(ctx context.Context, id string) (io.ReadCloser, error) {
	output, err := b.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &b.bucket,
		Key:    &id,
	})
	if err != nil {
		return nil, err
	}
	return output.Body, nil
}

func (b *Bucket) UploadURL(ctx context.Context, id string) (*url.URL, error) {
	output, err := b.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &b.bucket,
		Key:    &id,
	}, func(p *s3.PresignOptions) {
		p.Expires = b.uploadExpiry
	})
	if err != nil {
		return nil, err
	}
	return url.Parse(output.URL)
}

func (b *Bucket) DownloadURL(ctx context.Context, id string) (*url.URL, error) {
	output, err := b.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &b.bucket,
		Key:    &id,
	}, func(p *s3.PresignOptions) {
		p.Expires = b.downloadExpiry
	})
	if err != nil {
		return nil, err
	}
	return url.Parse(output.URL)
}
