FROM golang:latest as builder
WORKDIR /workdir
COPY ./src ./
RUN go mod tidy
# Set Environment Variable
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64
# Build
RUN go build -o app

FROM golang:bullseye
WORKDIR /
COPY --from=builder /workdir/app /app

ENTRYPOINT ["/app"]
