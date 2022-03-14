.PHONY: build
build:
	docker-compose build

.PHONY: build-m1
build-m1:
	docker-compose -f ./docker-compose.m1.yml build

.PHONY: build-debian
build-debian:
	docker-compose -f ./docker-compose.debian.yml build --parallel

.PHONY: upd-debian
upd-debian:
	docker-compose -f ./docker-compose.debian.yml up -d

.PHONY: up-debian
up-debian:
	docker-compose -f ./docker-compose.debian.yml up
