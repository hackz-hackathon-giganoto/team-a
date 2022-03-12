package base64

import (
	"bytes"
	"encoding/base64"
	"image"
	"image/jpeg"
	"image/png"
	"log"
	"net/http"
	"strings"
)

func Encode(b []byte) string {
	var base64EncodingPrefix string
	// Determine the content type of the image file
	mimeType := http.DetectContentType(b)
	// Prepend the appropriate URI scheme header depending
	// on the MIME type
	switch mimeType {
	case "image/jpeg":
		base64EncodingPrefix = "data:image/jpeg;base64,"
	case "image/jpg":
		base64EncodingPrefix = "data:image/jpeg;base64,"
	case "image/png":
		base64EncodingPrefix = "data:image/png;base64,"
	}
	return base64EncodingPrefix + base64.StdEncoding.EncodeToString(b)
}

func Decode(str string) image.Image {
	coI := strings.Index(string(str), ",")
	rawImage := string(str)[coI+1:]

	// Encoded Image DataUrl //
	unbased, _ := base64.StdEncoding.DecodeString(string(rawImage))

	res := bytes.NewReader(unbased)
	switch strings.TrimSuffix(str[5:coI], ";base64") {
	case "image/png":
		pngI, err := png.Decode(res)
		if err != nil {
			log.Fatalln(err)
		}
		return pngI
	case "image/jpeg":
		jpgI, err := jpeg.Decode(res)
		// ...
		if err != nil {
			log.Fatalln(err)
		}
		return jpgI
	}

	// data, err := base64.StdEncoding.DecodeString(str) //[]byte
	// return jpgI
	// return data
	// // file, _ := os.Create("encode_and_decord.jpg")
	// defer file.Close()

	// file.Write(data)
	return nil
}
