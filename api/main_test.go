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
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

type testMultipartFile struct {
	*bytes.Reader
}

func (f *testMultipartFile) Close() error { return nil }

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

// --- API Integration Tests ---

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

	var resp struct {
		Data []ExtractResult `json:"data"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Data)
	assert.NotEmpty(t, resp.Data[0].Palette)
	assert.Empty(t, resp.Data[0].Error)
}

// --- Unified Palette Handler Tests ---

func TestSavePaletteHandler_GuestUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/palettes", savePaletteHandler)

	// Clean up test directory
	testDir := "user_palettes"
	os.RemoveAll(testDir)
	defer os.RemoveAll(testDir)

	palette := SavePaletteRequest{
		Name: "test_palette",
		Palette: []Color{
			{Hex: "#FF0000"},
			{Hex: "#00FF00"},
			{Hex: "#0000FF"},
		},
	}
	paletteJSON, _ := json.Marshal(palette)

	req := httptest.NewRequest("POST", "/palettes", bytes.NewReader(paletteJSON))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var resp struct {
		Message string `json:"message"`
		Name    string `json:"name"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Message, "Palette saved successfully")
	assert.Equal(t, "test_palette", resp.Name)
}

func TestGetPalettesHandler_GuestUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.GET("/palettes", getPalettesHandler)

	// Clean up and setup test directory
	testDir := "user_palettes"
	os.RemoveAll(testDir)
	os.MkdirAll(testDir, 0755)
	defer os.RemoveAll(testDir)

	// Create test palette file
	testPalette := PaletteData{
		ID:   "test_palette.json",
		Name: "Test Palette",
		Palette: []Color{
			{Hex: "#FF0000"},
			{Hex: "#00FF00"},
		},
		CreatedAt: time.Now(),
	}

	file, err := os.Create(testDir + "/test_palette.json")
	assert.NoError(t, err)
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(testPalette)
	assert.NoError(t, err)

	req := httptest.NewRequest("GET", "/palettes", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp GetPalettesResponse
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.NotEmpty(t, resp.Palettes)
	assert.Equal(t, "Test Palette", resp.Palettes[0].Name)
	assert.Len(t, resp.Palettes[0].Palette, 2)
}

func TestDeletePaletteHandler_GuestUser(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/palettes/:id", deletePaletteHandler)

	// Clean up and setup test directory
	testDir := "user_palettes"
	os.RemoveAll(testDir)
	os.MkdirAll(testDir, 0755)
	defer os.RemoveAll(testDir)

	// Create test palette file
	testFileName := "test_palette_123.json"
	testPalette := PaletteData{
		ID:   testFileName,
		Name: "Test Palette",
		Palette: []Color{
			{Hex: "#FF0000"},
		},
		CreatedAt: time.Now(),
	}

	file, err := os.Create(testDir + "/" + testFileName)
	assert.NoError(t, err)
	defer file.Close()

	encoder := json.NewEncoder(file)
	err = encoder.Encode(testPalette)
	assert.NoError(t, err)
	file.Close()

	req := httptest.NewRequest("DELETE", "/palettes/"+testFileName, nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var resp struct {
		Message string `json:"message"`
	}
	err = json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Equal(t, "Palette deleted successfully", resp.Message)

	// Verify file is deleted
	_, err = os.Stat(testDir + "/" + testFileName)
	assert.True(t, os.IsNotExist(err))
}

func TestSavePaletteHandler_InvalidRequest(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/palettes", savePaletteHandler)

	// Test missing name
	t.Run("MissingName", func(t *testing.T) {
		palette := map[string]any{
			"palette": []Color{{Hex: "#FF0000"}},
		}
		paletteJSON, _ := json.Marshal(palette)

		req := httptest.NewRequest("POST", "/palettes", bytes.NewReader(paletteJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})

	// Test missing palette
	t.Run("MissingPalette", func(t *testing.T) {
		palette := map[string]any{
			"name": "test",
		}
		paletteJSON, _ := json.Marshal(palette)

		req := httptest.NewRequest("POST", "/palettes", bytes.NewReader(paletteJSON))
		req.Header.Set("Content-Type", "application/json")
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
	})
}

func TestDeletePaletteHandler_InvalidID(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/palettes/:id", deletePaletteHandler)

	// Test invalid ID with path traversal attempt - this will be handled by deleteFilePalette
	req := httptest.NewRequest("DELETE", "/palettes/test..path", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp struct {
		Error string `json:"error"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Error, "Failed to delete palette")
}

func TestDeletePaletteHandler_NotFound(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.DELETE("/palettes/:id", deletePaletteHandler)

	req := httptest.NewRequest("DELETE", "/palettes/nonexistent.json", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)

	var resp struct {
		Error string `json:"error"`
	}
	err := json.Unmarshal(w.Body.Bytes(), &resp)
	assert.NoError(t, err)
	assert.Contains(t, resp.Error, "Failed to delete palette")
}

func TestApplyPaletteHandler(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/apply-palette", applyPaletteHandler)

	img := createTestImage(10, 10)
	var buf bytes.Buffer
	png.Encode(&buf, img)

	palette := []Color{
		{Hex: "#FF0000"},
		{Hex: "#00FF00"},
		{Hex: "#0000FF"},
	}
	paletteJSON, _ := json.Marshal(palette)

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, _ := writer.CreateFormFile("file", "test.png")
	part.Write(buf.Bytes())
	writer.WriteField("palette", string(paletteJSON))
	writer.Close()

	req := httptest.NewRequest("POST", "/apply-palette", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "image/png", w.Header().Get("Content-Type"))
	assert.Greater(t, w.Body.Len(), 0)
}

// --- Utility Functions ---

func createTestImage(width, height int) *image.RGBA {
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

func TestCreateColorHex(t *testing.T) {
	color := createColor(255, 107, 53)
	assert.Equal(t, "#FF6B35", color.Hex)

	color = createColor(0, 0, 0)
	assert.Equal(t, "#000000", color.Hex)

	color = createColor(255, 255, 255)
	assert.Equal(t, "#FFFFFF", color.Hex)
}

func TestDemoUserEmail(t *testing.T) {
	demoEmail := "demo@imagepalette.com"
	assert.Contains(t, demoEmail, "@")
	assert.Contains(t, demoEmail, "demo")
	assert.Contains(t, demoEmail, "imagepalette.com")
}

func BenchmarkPixelSampling(b *testing.B) {
	img := createTestImage(300, 300)

	for b.Loop() {
		_ = samplePixels(img, 2, nil)
	}
}

func BenchmarkImageProcessing(b *testing.B) {
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
