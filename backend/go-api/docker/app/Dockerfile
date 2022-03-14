FROM golang:latest as builder
WORKDIR /workdir
COPY ./src ./
COPY ./docker/app/config ./config
RUN go mod tidy
# Set Environment Variable
ENV CGO_ENABLED=0
ENV GOOS=linux
ENV GOARCH=amd64
# Build
RUN go build -o app

FROM gcr.io/distroless/base
WORKDIR /
COPY --from=builder /workdir/app /app
COPY --from=builder /workdir/config /root/.kube/config

ENTRYPOINT ["/app"]
