dev:
	docker compose -f ./deploy/development/docker-compose.yaml up --build

dev-client:
	docker compose -f ./deploy/development/docker-compose.yaml up --build client
