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
	"os"
	"testing"

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

// --- Test for savePaletteToFileHandler ---

func TestSavePaletteToFileHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/save-palette", savePaletteToFileHandler)

	palette := []Color{
		{Hex: "#FF0000"},
		{Hex: "#00FF00"},
		{Hex: "#0000FF"},
	}
	paletteJSON, _ := json.Marshal(palette)

	fileName := "test_palette.json"
	req := httptest.NewRequest("POST", "/save-palette?fileName="+fileName, bytes.NewReader(paletteJSON))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Message  string `json:"message"`
		FileName string `json:"fileName"`
		Path     string `json:"path"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Palette saved successfully")
	assert.Contains(t, resp.FileName, "test_palette_")
	assert.Contains(t, resp.FileName, ".json")
	assert.Contains(t, resp.Path, "user_palettes/")

	file, err := os.Open(resp.Path)
	assert.NoError(t, err)
	defer file.Close()

	var loadedPalette []Color
	decoder := json.NewDecoder(file)
	err = decoder.Decode(&loadedPalette)
	assert.NoError(t, err)
	assert.Equal(t, palette, loadedPalette)

	os.Remove(resp.Path)
}

// --- Test for getPaletteHandler ---

func TestGetPaletteHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/get-palette", getPaletteHandler)

	testDir := "user_palettes"
	os.MkdirAll(testDir, 0755)
	defer os.RemoveAll(testDir)

	// Test 1: Happy path - valid file with palette
	t.Run("ValidPalette", func(t *testing.T) {
		palette := []Color{
			{Hex: "#FF0000"},
			{Hex: "#00FF00"},
			{Hex: "#0000FF"},
		}
		testFileName := "test_palette.json"
		testFilePath := testDir + "/" + testFileName

		file, err := os.Create(testFilePath)
		assert.NoError(t, err)
		defer file.Close()

		encoder := json.NewEncoder(file)
		err = encoder.Encode(palette)
		assert.NoError(t, err)

		req := httptest.NewRequest("GET", "/get-palette?fileName="+testFileName, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)

		var resp struct {
			Palette []Color `json:"palette"`
		}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, palette, resp.Palette)

		os.Remove(testFilePath)
	})

	// Test 2: Missing fileName parameter
	t.Run("MissingFileName", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/get-palette", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp struct {
			Error string `json:"error"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "File name is required", resp.Error)
	})

	// Test 3: Invalid fileName - too long
	t.Run("InvalidFileNameTooLong", func(t *testing.T) {
		longFileName := string(make([]byte, 257)) // 257 characters
		for i := range longFileName {
			longFileName = string(append([]byte(longFileName[:i]), 'a'))
		}

		req := httptest.NewRequest("GET", "/get-palette?fileName="+longFileName, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp struct {
			Error string `json:"error"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid file name", resp.Error)
	})

	// Test 4: Invalid fileName - contains invalid characters
	t.Run("InvalidFileNameCharacters", func(t *testing.T) {
		invalidFileName := "test<>|file.json"

		req := httptest.NewRequest("GET", "/get-palette?fileName="+invalidFileName, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp struct {
			Error string `json:"error"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "Invalid file name", resp.Error)
	})

	// Test 5: File not found
	t.Run("FileNotFound", func(t *testing.T) {
		nonExistentFile := "nonexistent.json"

		req := httptest.NewRequest("GET", "/get-palette?fileName="+nonExistentFile, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusNotFound, w.Code)

		var resp struct {
			Error string `json:"error"`
		}
		err := json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "Palette not found", resp.Error)
	})

	// Test 6: Invalid JSON in file
	t.Run("InvalidJSON", func(t *testing.T) {
		invalidJsonFileName := "invalid.json"
		invalidJsonFilePath := testDir + "/" + invalidJsonFileName

		file, err := os.Create(invalidJsonFilePath)
		assert.NoError(t, err)
		defer file.Close()

		_, err = file.WriteString("invalid json content")
		assert.NoError(t, err)

		req := httptest.NewRequest("GET", "/get-palette?fileName="+invalidJsonFileName, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusInternalServerError, w.Code)

		var resp struct {
			Error string `json:"error"`
		}
		err = json.Unmarshal(w.Body.Bytes(), &resp)
		assert.NoError(t, err)
		assert.Equal(t, "Failed to decode palette JSON", resp.Error)

		os.Remove(invalidJsonFilePath)
	})
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
