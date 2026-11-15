package main

import (
	"context"

	"github.com/sethvargo/go-envconfig/v2"
)

type config struct {
	Verification struct {
		Workers     int    `env:"WORKERS,default=3"`
		RetryPolicy string `env:"RETRY_POLICY,default=exp(start:5s cap:5m timeout:10m retry:3 power:2)"`
	} `env:",prefix=DUBSTER__VERIFICATION__"`
	S3 struct {
		Endpoint        string `env:"ENDPOINT,required"`
		AccessKeyID     string `env:"ACCESS_KEY_ID,required"`
		SecretAccessKey string `env:"SECRET_ACCESS_KEY,required"`
		VideosBucket    string `env:"VIDEOS_BUCKET,required"`
	} `env:",prefix=DUBSTER__S3__"`
	Log struct {
		Level string `env:"LEVEL,default=info"`
	} `env:",prefix=DUBSTER__LOG__"`
}

func loadConfigFromEnv() (*config, error) {
	var c config
	err := envconfig.Process(context.Background(), &c)
	return &c, err
}
