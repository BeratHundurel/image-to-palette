package main

import (
	"github.com/muesli/kmeans"
	"image"
	"image/color"
	"testing"
)

func extractPalette(img image.Image) ([]Color, error) {
	observations := samplePixels(img, 2)
	if len(observations) == 0 {
		return nil, nil
	}

	kmean := kmeans.New()
	clustersResult, err := kmean.Partition(observations, 5)
	if err != nil {
		return nil, err
	}

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

func createTestImage(width, height int) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			r := uint8((x * 255) / width)
			g := uint8((y * 255) / height)
			b := uint8(((x + y) * 255) / (width + height))
			img.Set(x, y, color.RGBA{r, g, b, 255})
		}
	}
	return img
}

func BenchmarkLargeImage(b *testing.B) {
	img := createTestImage(3000, 3000)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := extractPalette(img)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkPixelSampling(b *testing.B) {
	img := createTestImage(2000, 2000)
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = samplePixels(img, 2)
	}
}
