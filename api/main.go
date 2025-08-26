package main

// Image to Palette API
//
// Structure:
// 1) Imports
// 2) Types
// 3) Utilities (color helpers, file sanitization, etc.)
// 4) Palette Extraction core (sampling + kmeans)
// 5) Palette Application core (Shepard's method)
// 6) HTTP Handlers
// 7) main()

import (
	"bytes"
	"encoding/json"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/png"
	"math"
	"mime/multipart"
	"net/http"
	"os"
	"runtime"
	"slices"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "image/gif"
	_ "image/jpeg"

	_ "golang.org/x/image/webp"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/muesli/clusters"
	"github.com/muesli/kmeans"
)

////////////////////////////////////////////////////////////////////////////////
// 2) Types
////////////////////////////////////////////////////////////////////////////////

type Color struct {
	Hex string `json:"hex"`
}

type ExtractResult struct {
	Palette []Color `json:"palette,omitempty"`
	Error   string  `json:"error,omitempty"`
}

// Observation for k-means clustering
type colorObservation []float64

func (c colorObservation) Coordinates() clusters.Coordinates {
	return clusters.Coordinates(c)
}

func (c colorObservation) Distance(p clusters.Coordinates) float64 {
	var sum float64
	for i, v := range c {
		diff := v - p[i]
		sum += diff * diff
	}
	return sum
}

////////////////////////////////////////////////////////////////////////////////
// 3) Utilities
////////////////////////////////////////////////////////////////////////////////

func sanitizeFileName(name string) string {
	result := make([]rune, 0, len(name))
	for _, r := range name {
		switch {
		case r >= 'a' && r <= 'z',
			r >= 'A' && r <= 'Z',
			r >= '0' && r <= '9',
			r == '-', r == '_', r == '.':
			result = append(result, r)
		}
	}
	return string(result)
}

func rgbToHex(r, g, b uint32) string {
	return fmt.Sprintf("#%02X%02X%02X", r, g, b)
}

func hexToRGBA(s string) (color.RGBA, error) {
	s = strings.TrimSpace(s)
	if s == "" {
		return color.RGBA{}, fmt.Errorf("empty color")
	}
	if s[0] == '#' {
		s = s[1:]
	}
	if len(s) != 6 {
		return color.RGBA{}, fmt.Errorf("invalid hex color")
	}
	v, err := strconv.ParseUint(s, 16, 32)
	if err != nil {
		return color.RGBA{}, err
	}
	return color.RGBA{
		R: uint8(v >> 16),
		G: uint8((v >> 8) & 0xFF),
		B: uint8(v & 0xFF),
		A: 255,
	}, nil
}

func toRGBA(c color.Color) color.RGBA {
	r, g, b, a := c.RGBA()
	return color.RGBA{R: uint8(r >> 8), G: uint8(g >> 8), B: uint8(b >> 8), A: uint8(a >> 8)}
}

func colorDistanceSquared(c1, c2 color.RGBA) float64 {
	dr := float64(c1.R) - float64(c2.R)
	dg := float64(c1.G) - float64(c2.G)
	db := float64(c1.B) - float64(c2.B)
	return dr*dr + dg*dg + db*db
}

func nearestDistanceSquared(c color.RGBA, paletteRGBAs []color.RGBA) float64 {
	min := math.MaxFloat64
	for _, p := range paletteRGBAs {
		d := colorDistanceSquared(c, p)
		if d < min {
			min = d
		}
	}
	return min
}

func findNClosestColors(originalRGBA color.RGBA, paletteRGBAs []color.RGBA, n int) []struct {
	dist  float64
	color color.Color
} {
	if len(paletteRGBAs) == 0 {
		return nil
	}
	distances := make([]struct {
		dist  float64
		color color.Color
	}, 0, len(paletteRGBAs))
	for _, pRGBA := range paletteRGBAs {
		distances = append(distances, struct {
			dist  float64
			color color.Color
		}{
			dist:  colorDistanceSquared(originalRGBA, pRGBA),
			color: pRGBA,
		})
	}
	sort.Slice(distances, func(i, j int) bool {
		return distances[i].dist < distances[j].dist
	})
	if n > len(distances) {
		n = len(distances)
	}
	return distances[:n]
}

func extractColors(sortedColors []struct {
	dist  float64
	color color.Color
}) []color.Color {
	colors := make([]color.Color, len(sortedColors))
	for i, item := range sortedColors {
		colors[i] = item.color
	}
	return colors
}

func blendColors(colors []color.Color, weights []float64) color.RGBA {
	if len(colors) == 0 || len(colors) != len(weights) {
		return color.RGBA{}
	}
	var sumR, sumG, sumB float64
	var totalWeight float64
	for i := range colors {
		rgba := toRGBA(colors[i])
		sumR += float64(rgba.R) * weights[i]
		sumG += float64(rgba.G) * weights[i]
		sumB += float64(rgba.B) * weights[i]
		totalWeight += weights[i]
	}
	if totalWeight == 0 {
		return toRGBA(colors[0])
	}
	return color.RGBA{
		R: uint8(math.Round(sumR / totalWeight)),
		G: uint8(math.Round(sumG / totalWeight)),
		B: uint8(math.Round(sumB / totalWeight)),
		A: 255,
	}
}

func applyLuminosity(c color.RGBA, factor float64) color.RGBA {
	r := uint8(math.Max(0, math.Min(255, float64(c.R)*factor)))
	g := uint8(math.Max(0, math.Min(255, float64(c.G)*factor)))
	b := uint8(math.Max(0, math.Min(255, float64(c.B)*factor)))
	return color.RGBA{R: r, G: g, B: b, A: c.A}
}

func shepardsMethodColor(originalRGBA color.RGBA, paletteRGBAs []color.RGBA, nearest int, power float64) color.Color {
	closest := findNClosestColors(originalRGBA, paletteRGBAs, nearest)
	if len(closest) == 0 {
		return originalRGBA
	}
	if len(closest) == 1 || closest[0].dist == 0 {
		return closest[0].color
	}

	weights := make([]float64, len(closest))
	var totalWeight float64
	for i, c := range closest {
		if c.dist == 0 {
			return c.color
		}
		weight := 1.0 / math.Pow(math.Sqrt(c.dist), power)
		weights[i] = weight
		totalWeight += weight
	}
	if totalWeight == 0 {
		return closest[0].color
	}
	return blendColors(extractColors(closest), weights)
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

////////////////////////////////////////////////////////////////////////////////
// 4) Palette Extraction core
////////////////////////////////////////////////////////////////////////////////

func samplePixels(img image.Image, sampleRate int, filteredColors []string) clusters.Observations {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	estimatedSamples := (width * height) / (sampleRate * sampleRate)
	observations := make(clusters.Observations, 0, estimatedSamples)

	// Convert to RGBA once for fast pixel access
	var rgbaImg *image.RGBA
	if rgba, ok := img.(*image.RGBA); ok {
		rgbaImg = rgba
	} else {
		rgbaImg = image.NewRGBA(bounds)
		draw.Draw(rgbaImg, bounds, img, bounds.Min, draw.Src)
	}

	pix := rgbaImg.Pix
	stride := rgbaImg.Stride

	for y := bounds.Min.Y; y < bounds.Max.Y; y += sampleRate {
		for x := bounds.Min.X; x < bounds.Max.X; x += sampleRate {
			pixelOffset := (y-bounds.Min.Y)*stride + (x-bounds.Min.X)*4
			if pixelOffset+3 < len(pix) {
				r := float64(pix[pixelOffset]) / 255.0
				g := float64(pix[pixelOffset+1]) / 255.0
				b := float64(pix[pixelOffset+2]) / 255.0

				hexColor := rgbToHex(uint32(r*255), uint32(g*255), uint32(b*255))
				if len(filteredColors) > 0 && slices.Contains(filteredColors, hexColor) {
					continue
				}
				observations = append(observations, colorObservation{r, g, b})
			}
		}
	}
	return observations
}

func processImageForPalette(file multipart.File, numColors int, sampleRate int, filteredColors []string) ([]Color, error) {
	img, _, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Conservative heuristic to reduce sampling rate on very large images.
	bounds := img.Bounds()
	pixels := bounds.Dx() * bounds.Dy()
	if sampleRate == 4 {
		if pixels > 1000000 {
			sampleRate = 6
		} else if pixels > 4000000 {
			sampleRate = 8
		}
	}

	observations := samplePixels(img, sampleRate, filteredColors)
	if len(observations) == 0 {
		return nil, fmt.Errorf("no valid pixels found")
	}

	kmean := kmeans.New()
	clustersResult, err := kmean.Partition(observations, numColors)
	if err != nil {
		return nil, fmt.Errorf("kmeans failed: %w", err)
	}

	// Sort by cluster population (desc)
	sort.Slice(clustersResult, func(i, j int) bool {
		return len(clustersResult[i].Observations) > len(clustersResult[j].Observations)
	})

	// Convert centers to hex colors
	palette := make([]Color, 0, len(clustersResult))
	for _, cluster := range clustersResult {
		coords := cluster.Center.Coordinates()
		if len(coords) == 3 {
			r := uint32(coords[0] * 255)
			g := uint32(coords[1] * 255)
			b := uint32(coords[2] * 255)
			palette = append(palette, Color{Hex: rgbToHex(r, g, b)})
		}
	}
	return palette, nil
}

////////////////////////////////////////////////////////////////////////////////
// 5) Palette Application core (Shepard's method)
////////////////////////////////////////////////////////////////////////////////

func processImageWithShepardsMethod(
	img image.Image,
	paletteRGBAs []color.RGBA,
	luminosity float64,
	nearest int,
	power float64,
	maxDistanceSq float64,
) *image.RGBA {
	bounds := img.Bounds()
	height := bounds.Dy()
	out := image.NewRGBA(bounds)

	numWorkers := max(min(runtime.GOMAXPROCS(0), height), 1)
	rowsPerWorker := (height + numWorkers - 1) / numWorkers

	var wg sync.WaitGroup
	for workerID := range numWorkers {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			startY := bounds.Min.Y + id*rowsPerWorker
			endY := min(startY+rowsPerWorker, bounds.Max.Y)

			for y := startY; y < endY; y++ {
				for x := bounds.Min.X; x < bounds.Max.X; x++ {
					originalRGBA := toRGBA(img.At(x, y))

					if originalRGBA.A == 0 {
						out.Set(x, y, color.Transparent)
						continue
					}

					// If a maxDistance threshold is set and the nearest palette color is farther than the threshold,
					// keep the original color unchanged.
					if maxDistanceSq > 0 {
						if nearestDistanceSquared(originalRGBA, paletteRGBAs) > maxDistanceSq {
							out.Set(x, y, originalRGBA)
							continue
						}
					}

					adjusted := applyLuminosity(originalRGBA, luminosity)
					finalColor := shepardsMethodColor(adjusted, paletteRGBAs, nearest, power)
					out.Set(x, y, finalColor)
				}
			}
		}(workerID)
	}

	wg.Wait()
	return out
}

////////////////////////////////////////////////////////////////////////////////
// 6) HTTP Handlers
////////////////////////////////////////////////////////////////////////////////

// POST /extract-palette
// Multipart form: 'files' (one or many blobs), sampleRate (int), filteredColors (JSON array of hex)
func extractPaletteHandler(c *gin.Context) {
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid multipart form: " + err.Error()})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files provided"})
		return
	}

	sampleRateStr := c.PostForm("sampleRate")
	if sampleRateStr == "" {
		sampleRateStr = "4"
	}
	sampleRate, err := strconv.Atoi(sampleRateStr)
	if err != nil || sampleRate < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid sampleRate parameter"})
		return
	}

	var filteredColors []string
	filteredColorsStr := c.PostForm("filteredColors")
	if filteredColorsStr != "" {
		if err := json.Unmarshal([]byte(filteredColorsStr), &filteredColors); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filteredColors JSON"})
			return
		}
	}

	maxWorkers := minInt(runtime.GOMAXPROCS(0), len(files))
	semaphore := make(chan struct{}, maxWorkers)

	results := make([]ExtractResult, len(files))
	var wg sync.WaitGroup

	for i, fileHeader := range files {
		wg.Add(1)
		go func(index int, fh *multipart.FileHeader) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			file, err := fh.Open()
			if err != nil {
				results[index] = ExtractResult{Error: "Failed to open file: " + err.Error()}
				return
			}
			defer file.Close()

			palette, err := processImageForPalette(file, 8, sampleRate, filteredColors)
			if err != nil {
				results[index] = ExtractResult{Error: err.Error()}
				return
			}
			results[index] = ExtractResult{Palette: palette}
		}(i, fileHeader)
	}

	wg.Wait()
	c.JSON(http.StatusOK, gin.H{"data": results})
}

// POST /save-palette?fileName=<name.json>
// Body: JSON array of Color
func savePaletteToFileHandler(c *gin.Context) {
	var palette []Color
	if err := c.BindJSON(&palette); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid palette data"})
		return
	}

	fileName := c.Query("fileName")
	if fileName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File name is required"})
		return
	}

	dir := "user_palettes"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.Mkdir(dir, 0o755); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user_palettes directory: " + err.Error()})
			return
		}
	}

	// Fast semi-unique identifier using FNV-1a over hex strings
	hexConcat := make([]byte, 0, len(palette)*7)
	for _, color := range palette {
		hexConcat = append(hexConcat, color.Hex...)
	}
	var hash uint64 = 14695981039346656037
	for _, b := range hexConcat {
		hash ^= uint64(b)
		hash *= 1099511628211
	}
	hashStr := fmt.Sprintf("%x", hash)[:8]

	// Insert hash before extension; ensure .json
	extIdx := -1
	for i := len(fileName) - 1; i >= 0; i-- {
		if fileName[i] == '.' {
			extIdx = i
			break
		}
	}
	name, ext := fileName, ""
	if extIdx != -1 {
		name = fileName[:extIdx]
		ext = fileName[extIdx:]
	}
	if ext != ".json" {
		ext = ".json"
	}
	uniqueFileName := fmt.Sprintf("%s_%s%s", name, hashStr, ext)
	fullPath := fmt.Sprintf("%s/%s", dir, uniqueFileName)

	f, err := os.Create(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file: " + err.Error()})
		return
	}
	defer f.Close()

	encoder := json.NewEncoder(f)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(palette); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write palette to file: " + err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Palette saved successfully", "fileName": uniqueFileName, "path": fullPath})
}

// GET /get-palette?fileName=<name.json>
func getPaletteHandler(c *gin.Context) {
	fileName := c.Query("fileName")
	if fileName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File name is required"})
		return
	}
	if len(fileName) > 256 || fileName != sanitizeFileName(fileName) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file name"})
		return
	}

	fullPath := fmt.Sprintf("user_palettes/%s", fileName)
	f, err := os.Open(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Palette not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open palette file"})
		}
		return
	}
	defer f.Close()

	var palette []Color
	decoder := json.NewDecoder(f)
	if err := decoder.Decode(&palette); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode palette JSON"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"palette": palette})
}

// POST /apply-palette
// Multipart form fields:
//   - file: image to recolor
//   - palette: JSON array of hex strings OR array of { hex }
//   - optional: luminosity (float>0, default 1.0), nearest (int>=1, default 30),
//     power (float>0, default 4.0), maxDistance (float 0..~441; recolor only if nearest<=maxDistance)
func applyPaletteHandler(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file: " + err.Error()})
		return
	}
	defer file.Close()

	paletteStr := c.PostForm("palette")
	if paletteStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Palette is required (JSON array of hex strings or [{\"hex\":\"#RRGGBB\"}])"})
		return
	}

	var hexes []string
	if err := json.Unmarshal([]byte(paletteStr), &hexes); err != nil {
		var objs []Color
		if err2 := json.Unmarshal([]byte(paletteStr), &objs); err2 != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid palette JSON"})
			return
		}
		for _, o := range objs {
			hexes = append(hexes, o.Hex)
		}
	}

	paletteRGBAs := make([]color.RGBA, 0, len(hexes))
	for _, h := range hexes {
		if rgba, err := hexToRGBA(h); err == nil {
			paletteRGBAs = append(paletteRGBAs, rgba)
		}
	}
	if len(paletteRGBAs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Palette contained no valid colors"})
		return
	}

	luminosity := 1.0
	if s := c.PostForm("luminosity"); s != "" {
		if v, err := strconv.ParseFloat(s, 64); err == nil && v > 0 {
			luminosity = v
		}
	}
	nearest := 30
	if s := c.PostForm("nearest"); s != "" {
		if v, err := strconv.Atoi(s); err == nil && v >= 1 {
			nearest = v
		}
	}
	power := 4.0
	if s := c.PostForm("power"); s != "" {
		if v, err := strconv.ParseFloat(s, 64); err == nil && v > 0 {
			power = v
		}
	}

	maxDistanceSq := 0.0
	if s := c.PostForm("maxDistance"); s != "" {
		if v, err := strconv.ParseFloat(s, 64); err == nil && v > 0 {
			maxDistanceSq = v * v
		}
	}

	img, _, err := image.Decode(file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to decode image: " + err.Error()})
		return
	}

	out := processImageWithShepardsMethod(img, paletteRGBAs, luminosity, nearest, power, maxDistanceSq)

	var buf bytes.Buffer
	if err := png.Encode(&buf, out); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to encode PNG: " + err.Error()})
		return
	}
	c.Data(http.StatusOK, "image/png", buf.Bytes())
}

////////////////////////////////////////////////////////////////////////////////
// 7) main()
////////////////////////////////////////////////////////////////////////////////

func main() {
	router := gin.Default()

	// CORS
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Routes
	router.POST("/extract-palette", extractPaletteHandler)
	router.POST("/save-palette", savePaletteToFileHandler)
	router.GET("/get-palette", getPaletteHandler)
	router.POST("/apply-palette", applyPaletteHandler)

	// Start server
	router.Run(":8080")
}
