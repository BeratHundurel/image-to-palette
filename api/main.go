package main

import (
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	_ "golang.org/x/image/webp"
	"net/http"
	"sort"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/muesli/clusters"
	"github.com/muesli/kmeans"
)

type Color struct {
	Hex string `json:"hex"`
	RGB RGB    `json:"rgb"`
}

type RGB struct {
	R uint32 `json:"r"`
	G uint32 `json:"g"`
	B uint32 `json:"b"`
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
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error when binding the file": err.Error()})
		return
	}

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error when opening the file": err.Error()})
		return
	}
	defer file.Close()
	img, _, err := image.Decode(file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error when decoding the image": err.Error()})
		return
	}

	if img == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image"})
		return
	}

	bounds := img.Bounds()
	observations := make(clusters.Observations, 0)

	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			r, g, b, _ := img.At(x, y).RGBA()
			r8 := float64(r>>8) / 255.0
			g8 := float64(g>>8) / 255.0
			b8 := float64(b>>8) / 255.0
			observations = append(observations, colorObservation{r8, g8, b8})
		}
	}

	kmean := kmeans.New()
	clustersResult, err := kmean.Partition(observations, 5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Color quantization failed: " + err.Error()})
		return
	}

	sort.Slice(clustersResult, func(i, j int) bool {
		return len(clustersResult[i].Observations) > len(clustersResult[j].Observations)
	})

	palette := []Color{}
	for _, cluster := range clustersResult {
		centroidCoords := cluster.Center.Coordinates()
		if len(centroidCoords) == 3 {
			r := uint32(centroidCoords[0] * 255)
			g := uint32(centroidCoords[1] * 255)
			b := uint32(centroidCoords[2] * 255)
			palette = append(palette, Color{
				Hex: rgbToHex(r, g, b),
				RGB: RGB{R: r, G: g, B: b},
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{"palette": palette})
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
