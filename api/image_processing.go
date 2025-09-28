package main

import (
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"mime/multipart"
	"runtime"
	"slices"
	"sort"
	"sync"

	"github.com/muesli/clusters"
	"github.com/muesli/kmeans"
)

func samplePixels(img image.Image, sampleRate int, filteredColors []string) clusters.Observations {
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
			palette = append(palette, createColor(uint8(r), uint8(g), uint8(b)))
		}
	}
	return palette, nil
}

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
