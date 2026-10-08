package config

import (
	"context"
	"strconv"

	"github.com/sethvargo/go-envconfig/v2"
)

type Config struct {
	ServerAddress string
	Postgres      Postgres `env:",prefix=POSTGRES__"`
}

type Postgres struct {
	Host     string `env:"HOST,required"`
	Port     int    `env:"PORT,required"`
	Database string
	User     string
	Password string
}

func (p *Postgres) URI() string {
	return "postgresql://" + p.User + ":" + p.Password + "@" + p.Host + ":" + strconv.Itoa(p.Port)
}

func Parse() (Config, error) {
	var c Config
	err := envconfig.Process(context.Background(), &c)
	return c, err
}
