package s3

import (
	"context"
	"fmt"
	"io"
	"net/url"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/nvnazarov/dubster/server/internal/misc/blob"
)

type Folder struct {
	name   string
	bucket Bucket
}

type File struct {
	name   string
	bucket Bucket
}

type Bucket struct {
	name    string
	storage Storage
}

type Storage struct {
	client        *s3.Client
	presignClient *s3.PresignClient
}

type Config struct {
	endpoint        string
	accessKeyID     string
	secretAccessKey string
}

type Option func(cfg *Config)

func Endpoint(endpoint string) Option {
	return func(cfg *Config) {
		cfg.endpoint = endpoint
	}
}

func Credentials(accessKeyID, secretAccessKey string) Option {
	return func(cfg *Config) {
		cfg.accessKeyID = accessKeyID
		cfg.secretAccessKey = secretAccessKey
	}
}

func NewStorage(options ...Option) (*Storage, error) {
	cfg := Config{}
	for _, opt := range options {
		opt(&cfg)
	}
	awscfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion("eu-east-1"),
		config.WithCredentialsProvider(
			aws.CredentialsProviderFunc(
				func(context.Context) (aws.Credentials, error) {
					return aws.Credentials{
						AccessKeyID:     cfg.accessKeyID,
						SecretAccessKey: cfg.secretAccessKey,
					}, nil
				},
			),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}
	client := s3.NewFromConfig(awscfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.endpoint)
		o.UsePathStyle = true
	})
	presignClient := s3.NewPresignClient(client)
	return &Storage{
		client:        client,
		presignClient: presignClient,
	}, nil
}

func (s Storage) Bucket(name string) Bucket {
	return Bucket{
		name:    name,
		storage: s,
	}
}

func (b Bucket) File(name string) blob.RemoteFile {
	return &File{
		name:   name,
		bucket: b,
	}
}

func (b Bucket) Folder(name string) blob.RemoteFolder {
	return &Folder{
		name:   name,
		bucket: b,
	}
}

func (f Folder) File(name string) blob.RemoteFile {
	return &File{
		name:   f.name + "/" + name,
		bucket: f.bucket,
	}
}

func (f Folder) Folder(name string) blob.RemoteFolder {
	return &Folder{
		name:   f.name + "/" + name,
		bucket: f.bucket,
	}
}

func (f File) UploadURL(ctx context.Context, expiry time.Duration) (*url.URL, error) {
	output, err := f.bucket.storage.presignClient.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket: &f.bucket.name,
		Key:    &f.name,
	}, func(p *s3.PresignOptions) {
		p.Expires = expiry
	})
	if err != nil {
		return nil, fmt.Errorf("presign put object: %w", err)
	}
	return url.Parse(output.URL)
}

func (f File) DownloadURL(ctx context.Context, expiry time.Duration) (*url.URL, error) {
	output, err := f.bucket.storage.presignClient.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: &f.bucket.name,
		Key:    &f.name,
	}, func(p *s3.PresignOptions) {
		p.Expires = expiry
	})
	if err != nil {
		return nil, fmt.Errorf("presign get object: %w", err)
	}
	return url.Parse(output.URL)
}

func (f File) Reader(ctx context.Context) (io.ReadCloser, error) {
	output, err := f.bucket.storage.client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: &f.bucket.name,
		Key:    &f.name,
	})
	if err != nil {
		return nil, fmt.Errorf("get object: %w", err)
	}
	return output.Body, nil
}

func (f File) Writer(ctx context.Context) (io.WriteCloser, error) {
	// TODO: implement.
	panic("s3 writer: not implemented")
}
