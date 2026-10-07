package main

type Config struct {
	ServerAddress      string
	PostgresConnString string
}

func ParseConfig() (Config, error) {
	return Config{}, nil
}
