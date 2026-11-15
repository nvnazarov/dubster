// Program verifier runs the clip verification process.
package main

import (
	"context"
	"log/slog"

	"github.com/nvnazarov/dubster/server/internal/infra/kafka/verification"
	"github.com/nvnazarov/dubster/server/internal/infra/s3"
	"github.com/nvnazarov/dubster/server/internal/misc/retry"
)

func main() {
	config := must(loadConfigFromEnv())
	logger := createLogger(config)
	videos := must(s3.NewStorage(
		s3.Endpoint(config.S3.Endpoint),
		s3.Credentials(config.S3.AccessKeyID, config.S3.SecretAccessKey),
	)).Bucket(config.S3.VideosBucket)
	verification := verification.New(
		videos,
		verification.Workers(config.Verification.Workers),
		verification.Retry(must(retry.Parse(config.Verification.RetryPolicy))),
		verification.Logger(logger),
	)
	if err := verification.Run(context.Background()); err != nil {
		logger.Error("verification crashed with error", slog.String("error", err.Error()))
	} else {
		logger.Info("verification ended without errors")
	}
}
