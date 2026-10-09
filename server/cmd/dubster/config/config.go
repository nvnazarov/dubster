package config

import (
	"context"
	"time"

	"github.com/nvnazarov/dubster/server/internal/misc/size"
	"github.com/sethvargo/go-envconfig/v2"
)

type Config struct {
	Postgres Postgres `env:",prefix=DUBSTER__POSTGRES__"`
	S3       S3       `env:",prefix=DUBSTER__S3__"`
	Server   Server   `env:",prefix=DUBSTER__SERVER__"`
	Clip     Clip     `env:",prefix=DUBSTER__CLIP__"`
	Session  Session  `env:",prefix=DUBSTER__SESSION__"`
}

type Server struct {
	Host string `env:"HOST,default=127.0.0.1"`
	Port string `env:"PORT,default=8080"`
}

type Clip struct {
	MaxSize     Size          `env:"MAX_SIZE,default=100mb"`
	MaxDuration time.Duration `env:"MAX_DURATION,default=2m"`
	MaxRoles    int           `env:"MAX_ROLES,default=10"`
	MaxSegments int           `env:"MAX_SEGMENTS,default=100"`
}

type Session struct {
	MaxParticipants int           `env:"MAX_PARTICIPANTS,default=10"`
	Expiry          time.Duration `env:"EXPIRY,default=1h"`
}

type Postgres struct {
	Host     string       `env:"HOST,required"`
	Port     string       `env:"PORT,required"`
	Database string       `env:"DB,required"`
	User     string       `env:"USER,required"`
	Password SecretString `env:"PASSWORD,required"`
}

type S3 struct {
	AccessKey         SecretString  `env:"ACCESS_KEY,required"`
	SecretKey         SecretString  `env:"SECRET_KEY,required"`
	Endpoint          string        `env:"ENDPOINT,required"`
	DownloadURLExpiry time.Duration `env:"DOWNLOAD_URL__EXPIRY,default=30m"`
	UploadURLExpiry   time.Duration `env:"UPLOAD_URL__EXPIRY,default=30m"`
}

type SecretString string

func (s SecretString) String() string {
	return "***"
}

type Size size.Size

func (s *Size) EnvDecode(ctx context.Context, val string) error {
	size, err := size.Parse(val)
	*s = Size(size)
	return err
}

func (p *Postgres) URI() string {
	return "postgresql://" + p.User + ":" + string(p.Password) + "@" + p.Host + ":" + p.Port + "/" + p.Database
}

func (s *Server) Address() string {
	return s.Host + ":" + s.Port
}

func Parse() (*Config, error) {
	var c Config
	err := envconfig.Process(context.Background(), &c)
	return &c, err
}
