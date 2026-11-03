build:
	go build -v ./cmd/dubster

test:
	go test -v ./...

format-check:
	@if [ -n "$$(gofmt -l .)" ]; then \
		echo "The following files need formatting:"; \
		gofmt -l .; \
		exit 1; \
	fi
