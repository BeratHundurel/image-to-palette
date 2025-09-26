package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type PaletteData struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Palette   []Color   `json:"palette"`
	CreatedAt time.Time `json:"createdAt"`
}

type SavePaletteRequest struct {
	Name    string  `json:"name" binding:"required"`
	Palette []Color `json:"palette" binding:"required"`
}

type GetPalettesResponse struct {
	Palettes []PaletteData `json:"palettes"`
}

func isAuthenticated(c *gin.Context) (bool, uint) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		return false, 0
	}

	bearerToken := strings.Split(authHeader, " ")
	if len(bearerToken) != 2 || bearerToken[0] != "Bearer" {
		return false, 0
	}

	claims, err := validateJWTToken(bearerToken[1])
	if err != nil {
		return false, 0
	}

	return true, claims.UserID
}

func savePaletteHandler(c *gin.Context) {
	var req SavePaletteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authenticated, userID := isAuthenticated(c)

	if authenticated {
		err := saveUserPalette(userID, req.Name, req.Palette)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save palette"})
			return
		}
	} else {
		err := saveFilePalette(req.Name, req.Palette)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save palette"})
			return
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Palette saved successfully",
		"name":    req.Name,
	})
}

func getPalettesHandler(c *gin.Context) {
	authenticated, userID := isAuthenticated(c)

	var palettes []PaletteData
	var err error

	if authenticated {
		palettes, err = getUserPalettes(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch palettes"})
			return
		}
	} else {
		palettes, err = getFilePalettes()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch palettes"})
			return
		}
	}

	c.JSON(http.StatusOK, GetPalettesResponse{Palettes: palettes})
}

func deletePaletteHandler(c *gin.Context) {
	paletteID := c.Param("id")
	if paletteID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Palette ID is required"})
		return
	}

	authenticated, userID := isAuthenticated(c)

	if authenticated {
		err := deleteUserPalette(userID, paletteID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete palette"})
			return
		}
	} else {
		err := deleteFilePalette(paletteID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete palette"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Palette deleted successfully"})
}

func saveUserPalette(userID uint, name string, palette []Color) error {
	if DB == nil {
		return fmt.Errorf("database not available")
	}

	paletteJSON, err := json.Marshal(palette)
	if err != nil {
		return err
	}

	dbPalette := Palette{
		UserID:   &userID,
		JsonData: string(paletteJSON),
		Name:     name,
	}

	return DB.Create(&dbPalette).Error
}

func getUserPalettes(userID uint) ([]PaletteData, error) {
	if DB == nil {
		return nil, fmt.Errorf("database not available")
	}

	var dbPalettes []Palette
	err := DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&dbPalettes).Error
	if err != nil {
		return nil, err
	}

	palettes := make([]PaletteData, len(dbPalettes))
	for i, dbPalette := range dbPalettes {
		var colors []Color
		if err := json.Unmarshal([]byte(dbPalette.JsonData), &colors); err != nil {
			continue
		}

		palettes[i] = PaletteData{
			ID:        fmt.Sprintf("%d", dbPalette.ID),
			Name:      dbPalette.Name,
			Palette:   colors,
			CreatedAt: dbPalette.CreatedAt,
		}
	}

	return palettes, nil
}

func deleteUserPalette(userID uint, paletteID string) error {
	if DB == nil {
		return fmt.Errorf("database not available")
	}

	result := DB.Where("id = ? AND user_id = ?", paletteID, userID).Delete(&Palette{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("palette not found or unauthorized")
	}

	return nil
}

func saveFilePalette(name string, palette []Color) error {
	dir := "user_palettes"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		if err := os.Mkdir(dir, 0o755); err != nil {
			return fmt.Errorf("failed to create user_palettes directory: %w", err)
		}
	}

	timestamp := time.Now().Unix()
	fileName := fmt.Sprintf("%s_%d.json", sanitizeFileName(name), timestamp)
	fullPath := fmt.Sprintf("%s/%s", dir, fileName)

	paletteData := PaletteData{
		ID:        fileName,
		Name:      name,
		Palette:   palette,
		CreatedAt: time.Now(),
	}

	f, err := os.Create(fullPath)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer f.Close()

	encoder := json.NewEncoder(f)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(paletteData); err != nil {
		return fmt.Errorf("failed to write palette to file: %w", err)
	}

	return nil
}

func getFilePalettes() ([]PaletteData, error) {
	dir := "user_palettes"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return []PaletteData{}, nil
	}

	files, err := os.ReadDir(dir)
	if err != nil {
		return nil, fmt.Errorf("failed to read directory: %w", err)
	}

	var palettes []PaletteData
	for _, file := range files {
		if file.IsDir() || !strings.HasSuffix(file.Name(), ".json") {
			continue
		}

		fullPath := fmt.Sprintf("%s/%s", dir, file.Name())
		f, err := os.Open(fullPath)
		if err != nil {
			continue
		}

		var paletteData PaletteData
		decoder := json.NewDecoder(f)
		if err := decoder.Decode(&paletteData); err != nil {
			f.Close()
			continue
		}
		f.Close()

		if paletteData.ID == "" {
			paletteData.ID = file.Name()
		}

		palettes = append(palettes, paletteData)
	}

	return palettes, nil
}

func deleteFilePalette(paletteID string) error {
	dir := "user_palettes"
	fullPath := fmt.Sprintf("%s/%s", dir, paletteID)

	if strings.Contains(paletteID, "..") || strings.Contains(paletteID, "/") || strings.Contains(paletteID, "\\") {
		return fmt.Errorf("invalid palette ID")
	}

	if err := os.Remove(fullPath); err != nil {
		if os.IsNotExist(err) {
			return fmt.Errorf("palette not found")
		}
		return fmt.Errorf("failed to delete palette: %w", err)
	}

	return nil
}
