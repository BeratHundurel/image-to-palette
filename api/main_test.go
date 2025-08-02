package main

import (
	"bytes"
	"encoding/json"
	"image"
	"image/color"
	"image/png"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

type testMultipartFile struct {
	*bytes.Reader
}

func (f *testMultipartFile) Close() error { return nil }

// --- Unit Tests ---

func TestSamplePixels_FilteredColors(t *testing.T) {
	img := createTestImage(10, 10)
	filtered := []string{"#000000"}
	obs := samplePixels(img, 1, filtered)
	for _, o := range obs {
		coords := o.Coordinates()
		hex := rgbToHex(uint32(coords[0]*255), uint32(coords[1]*255), uint32(coords[2]*255))
		if hex == "#000000" {
			t.Errorf("Filtered color found in observations")
		}
	}
}

func TestProcessImageForPalette_KnownImage(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 2, 2))
	img.Set(0, 0, color.RGBA{255, 0, 0, 255})   // Red
	img.Set(1, 0, color.RGBA{0, 255, 0, 255})   // Green
	img.Set(0, 1, color.RGBA{0, 0, 255, 255})   // Blue
	img.Set(1, 1, color.RGBA{255, 255, 0, 255}) // Yellow

	var buf bytes.Buffer
	png.Encode(&buf, img)
	reader := bytes.NewReader(buf.Bytes())
	file := &testMultipartFile{reader}

	palette, err := processImageForPalette(file, 4, 1, nil)
	assert.NoError(t, err)
	assert.NotEmpty(t, palette)
}

// --- API Integration Test ---

func TestExtractPaletteHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/extract-palette", extractPaletteHandler)

	img := createTestImage(10, 10)
	var buf bytes.Buffer
	png.Encode(&buf, img)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("files", "test.png")
	part.Write(buf.Bytes())
	writer.WriteField("sampleRate", "2")
	writer.Close()

	req := httptest.NewRequest("POST", "/extract-palette", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	// The response is {"data":[{"palette":[...],"error":""}]}
	var resp struct {
		Data []struct {
			Palette []Color `json:"palette"`
			Error   string  `json:"error"`
		} `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Data)
	assert.NotEmpty(t, resp.Data[0].Palette)
	assert.Empty(t, resp.Data[0].Error)
}

// --- Benchmarks ---

func createTestImage(width, height int) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := range height {
		for x := range width {
			r := uint8((x * 255) / width)
			g := uint8((y * 255) / height)
			b := uint8(((x + y) * 255) / (width + height))
			img.Set(x, y, color.RGBA{r, g, b, 255})
		}
	}
	return img
}

func BenchmarkPixelSampling(b *testing.B) {
	img := createTestImage(300, 300)

	for b.Loop() {
		_ = samplePixels(img, 2, nil)
	}
}

func BenchmarkImage(b *testing.B) {
	img := createTestImage(300, 300)
	var buf bytes.Buffer
	png.Encode(&buf, img)
	fileBytes := buf.Bytes()

	for b.Loop() {
		reader := bytes.NewReader(fileBytes)
		file := &testMultipartFile{reader}
		_, err := processImageForPalette(file, 5, 2, nil)
		if err != nil {
			b.Fatal(err)
		}
	}
}

// Benchmark processing a image 10 times and log total time taken
func BenchmarkImageTenTimes(b *testing.B) {
	img := createTestImage(300, 300)
	var buf bytes.Buffer
	png.Encode(&buf, img)
	fileBytes := buf.Bytes()

	start := time.Now()
	for range 10 {
		reader := bytes.NewReader(fileBytes)
		file := &testMultipartFile{reader}
		_, err := processImageForPalette(file, 5, 2, nil)
		if err != nil {
			b.Fatal(err)
		}
	}
	elapsed := time.Since(start)
	b.Logf("Processing large image 10 times took: %s", elapsed)
}
