package main

import (
	"fmt"
	"image"
	"image/draw"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"mime/multipart"
	"net/http"
	"runtime"
	"sort"
	"sync"
	"time"

	_ "golang.org/x/image/webp"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/muesli/clusters"
	"github.com/muesli/kmeans"
)

type Color struct {
	Hex string `json:"hex"`
}

type result struct {
	Palette []Color `json:"palette,omitempty"`
	Error   string  `json:"error,omitempty"`
}

// colorObservation implements the clusters.Observation interface for RGB colors.

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

func rgbToHex(r, g, b uint32) string {
	return fmt.Sprintf("#%02X%02X%02X", r, g, b)
}

func samplePixels(img image.Image, sampleRate int) clusters.Observations {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	estimatedSamples := (width * height) / (sampleRate * sampleRate)
	observations := make(clusters.Observations, 0, estimatedSamples)

	var rgbaImg *image.RGBA
	if rgba, ok := img.(*image.RGBA); ok {
		rgbaImg = rgba
	} else {
		rgbaImg = image.NewRGBA(bounds)
		draw.Draw(rgbaImg, bounds, img, bounds.Min, draw.Src)
	}

	stride := rgbaImg.Stride
	pix := rgbaImg.Pix

	for y := bounds.Min.Y; y < bounds.Max.Y; y += sampleRate {
		for x := bounds.Min.X; x < bounds.Max.X; x += sampleRate {
			pixelOffset := (y-bounds.Min.Y)*stride + (x-bounds.Min.X)*4
			if pixelOffset+3 < len(pix) {
				r := float64(pix[pixelOffset]) / 255.0
				g := float64(pix[pixelOffset+1]) / 255.0
				b := float64(pix[pixelOffset+2]) / 255.0

				observations = append(observations, colorObservation{r, g, b})
			}
		}
	}

	return observations
}

func processImageForPalette(file multipart.File, numColors int) ([]Color, error) {
	img, _, err := image.Decode(file)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	pixels := bounds.Dx() * bounds.Dy()
	sampleRate := 2
	if pixels > 1000000 {
		sampleRate = 4
	} else if pixels > 4000000 {
		sampleRate = 6
	}

	observations := samplePixels(img, sampleRate)
	if len(observations) == 0 {
		return nil, fmt.Errorf("no valid pixels found")
	}

	kmean := kmeans.New()
	clustersResult, err := kmean.Partition(observations, numColors)
	if err != nil {
		return nil, fmt.Errorf("kmeans failed: %w", err)
	}

	sort.Slice(clustersResult, func(i, j int) bool {
		return len(clustersResult[i].Observations) > len(clustersResult[j].Observations)
	})

	palette := make([]Color, 0, len(clustersResult))
	for _, cluster := range clustersResult {
		coords := cluster.Center.Coordinates()
		if len(coords) == 3 {
			r := uint32(coords[0] * 255)
			g := uint32(coords[1] * 255)
			b := uint32(coords[2] * 255)
			palette = append(palette, Color{
				Hex: rgbToHex(r, g, b),
			})
		}
	}

	return palette, nil
}

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

	maxWorkers := runtime.GOMAXPROCS(0)
	if maxWorkers > len(files) {
		maxWorkers = len(files)
	}

	semaphore := make(chan struct{}, maxWorkers)
	results := make([]result, len(files))
	var wg sync.WaitGroup

	for i, fileHeader := range files {
		wg.Add(1)

		go func(index int, fh *multipart.FileHeader) {
			defer wg.Done()

			semaphore <- struct{}{}
			defer func() { <-semaphore }()

			file, err := fh.Open()
			if err != nil {
				results[index] = result{Error: "Failed to open file: " + err.Error()}
				return
			}
			defer file.Close()

			palette, err := processImageForPalette(file, 5)
			if err != nil {
				results[index] = result{Error: err.Error()}
				return
			}

			results[index] = result{Palette: palette}
		}(i, fileHeader)
	}

	wg.Wait()
	c.JSON(http.StatusOK, gin.H{"data": results})
}

func main() {
	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"POST", "GET", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	router.POST("/extract-palette", extractPaletteHandler)
	router.Run(":8080")
}
