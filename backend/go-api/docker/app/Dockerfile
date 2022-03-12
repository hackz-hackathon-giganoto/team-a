# FROM notchman/opencv:latest as builder-cv
# WORKDIR /banana

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
# RUN apt update && apt install -y \ 
#     g++ build-essential libeigen3-dev libtbb-dev pkg-config libavcodec-dev libavformat-dev libswscale-dev \
#     libjpeg-dev libpng++-dev libtiff-dev libopenexr-dev libwebp-dev \
#     libhdf5-dev libopenblas-dev liblapacke-dev \
#     && rm -rf /var/lib/apt/lists/*
COPY --from=builder /workdir/app /app
# COPY --from=builder-cv /cheese/out/ /

# COPY --from=builder-cv /cheese/DisplayImage /DisplayImage
# COPY --from=builder-cv /cheese/*.xml /*.xml
# COPY --from=builder-cv /cheese/template.JPG /template.JPG
# COPY --from=builder-cv /usr/local/lib /usr/local/lib

# テスト
# RUN mkdir /cheese
# RUN ./DisplayImage

ENTRYPOINT ["/app"]
