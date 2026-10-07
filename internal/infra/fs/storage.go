package fs

import (
	"context"
	"io"
	"io/fs"
	"net/http"
	"net/url"
	"os"
	"strconv"
)

type Storage struct {
	fs   fs.FS
	addr string
}

func NewStorage(dir string) *Storage {
	fs := os.DirFS(dir)
	return &Storage{fs: fs}
}

func (s *Storage) Serve(host string, port int) error {
	s.addr = host + ":" + strconv.Itoa(port)
	server := http.Server{
		Addr:    s.addr,
		Handler: http.FileServerFS(s.fs),
	}
	return server.ListenAndServe()
}

func (s *Storage) OpenWrite(ctx context.Context, id string) (io.WriteCloser, error) {
	// TODO: implement.
	panic("not implemented")
}

func (s *Storage) OpenRead(ctx context.Context, id string) (io.ReadCloser, error) {
	return s.fs.Open(id)
}

func (s *Storage) UploadURL(ctx context.Context, id string) (url.URL, error) {
	u, err := url.Parse("http://" + s.addr + "/" + id)
	return *u, err
}

func (s *Storage) DownloadURL(ctx context.Context, id string) (url.URL, error) {
	u, err := url.Parse("http://" + s.addr + "/" + id)
	return *u, err
}
