FROM golang:1.27 AS base
WORKDIR /app

FROM base AS deps
COPY go.mod go.sum ./
RUN go mod download

FROM deps AS build
COPY . .
RUN go build -o app /app/cmd/dubster

FROM debian:stable-slim AS production
WORKDIR /app
COPY --from=build /app/app .
CMD ["./app"]

FROM deps AS development-deps
RUN go install github.com/air-verse/air@latest

FROM development-deps AS development
COPY . .
CMD ["air", "-c", ".air.toml"]
