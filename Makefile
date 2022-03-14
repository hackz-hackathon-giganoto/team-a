install:
	yarn

dev_front:
	yarn workspace frontend start

# ちょっと頭の良くない実装かもしれない（自傷）
dev_goapi:
	cd ./backend/go-api/src && docker compose up -d --build
go_mod_tidy:
	cd ./backend/go-api/src && go mod tidy
go_fmt:
	cd ./backend/go-api/src && go fmt
