package main

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"mime/multipart"
	"net/http"
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

type RGB struct {
	R uint32 `json:"r"`
	G uint32 `json:"g"`
	B uint32 `json:"b"`
}

type result struct {
	Palette []Color `json:"palette,omitempty"`
	Error   string  `json:"error,omitempty"`
}

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

	var (
		results []result
		mu      sync.Mutex
		wg      sync.WaitGroup
	)

	for _, fileHeader := range files {
		wg.Add(1)

		go func(fh *multipart.FileHeader) {
			defer wg.Done()

			file, err := fh.Open()
			if err != nil {
				mu.Lock()
				results = append(results, result{Error: "Failed to open file: " + err.Error()})
				mu.Unlock()
				return
			}
			defer file.Close()

			img, _, err := image.Decode(file)
			if err != nil {
				mu.Lock()
				results = append(results, result{Error: "Failed to decode image: " + err.Error()})
				mu.Unlock()
				return
			}

			bounds := img.Bounds()
			observations := make(clusters.Observations, 0, bounds.Dx()*bounds.Dy()/10)

			for y := bounds.Min.Y; y < bounds.Max.Y; y += 2 {
				for x := bounds.Min.X; x < bounds.Max.X; x += 2 {
					r, g, b, _ := img.At(x, y).RGBA()
					observations = append(observations, colorObservation{
						float64(r>>8) / 255.0,
						float64(g>>8) / 255.0,
						float64(b>>8) / 255.0,
					})
				}
			}

			kmean := kmeans.New()
			clustersResult, err := kmean.Partition(observations, 5)
			if err != nil {
				mu.Lock()
				results = append(results, result{Error: "KMeans failed: " + err.Error()})
				mu.Unlock()
				return
			}

			sort.Slice(clustersResult, func(i, j int) bool {
				return len(clustersResult[i].Observations) > len(clustersResult[j].Observations)
			})

			palette := []Color{}
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

			mu.Lock()
			results = append(results, result{Palette: palette})
			mu.Unlock()

		}(fileHeader)
	}

	wg.Wait()
	c.JSON(http.StatusOK, gin.H{"results": results})
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
