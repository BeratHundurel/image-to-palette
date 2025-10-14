package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

type WorkspaceStateData struct {
	Colors             []Color    `json:"colors"`
	Selectors          []Selector `json:"selectors"`
	DrawSelectionValue string     `json:"drawSelectionValue"`
	ActiveSelectorId   string     `json:"activeSelectorId"`
	FilteredColors     []string   `json:"filteredColors"`
	SampleRate         int        `json:"sampleRate"`
	Luminosity         float64    `json:"luminosity"`
	Nearest            int        `json:"nearest"`
	Power              int        `json:"power"`
	MaxDistance        float64    `json:"maxDistance"`
}

type Selector struct {
	ID        string     `json:"id"`
	Color     string     `json:"color"`
	Selected  bool       `json:"selected"`
	Selection *Selection `json:"selection,omitempty"`
}

type Selection struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	W float64 `json:"w"`
	H float64 `json:"h"`
}

type WorkspaceData struct {
	ID                 string     `json:"id"`
	Name               string     `json:"name"`
	ImageData          string     `json:"imageData"`
	Colors             []Color    `json:"colors"`
	Selectors          []Selector `json:"selectors"`
	DrawSelectionValue string     `json:"drawSelectionValue"`
	ActiveSelectorId   string     `json:"activeSelectorId"`
	FilteredColors     []string   `json:"filteredColors"`
	SampleRate         int        `json:"sampleRate"`
	Luminosity         float64    `json:"luminosity"`
	Nearest            int        `json:"nearest"`
	Power              int        `json:"power"`
	MaxDistance        float64    `json:"maxDistance"`
	CreatedAt          string     `json:"createdAt"`
}

type SaveWorkspaceRequest struct {
	Name               string     `json:"name" binding:"required"`
	ImageData          string     `json:"imageData" binding:"required"`
	Colors             []Color    `json:"colors"`
	Selectors          []Selector `json:"selectors"`
	DrawSelectionValue string     `json:"drawSelectionValue"`
	ActiveSelectorId   string     `json:"activeSelectorId"`
	FilteredColors     []string   `json:"filteredColors"`
	SampleRate         int        `json:"sampleRate"`
	Luminosity         float64    `json:"luminosity"`
	Nearest            int        `json:"nearest"`
	Power              int        `json:"power"`
	MaxDistance        float64    `json:"maxDistance"`
}

type GetWorkspacesResponse struct {
	Workspaces []WorkspaceData `json:"workspaces"`
}

func saveWorkspaceHandler(c *gin.Context) {
	var req SaveWorkspaceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	authenticated, userID := isAuthenticated(c)

	if !authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to save workspaces"})
		return
	}

	err := saveUserWorkspace(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save workspace"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Workspace saved successfully",
		"name":    req.Name,
	})
}

func getWorkspacesHandler(c *gin.Context) {
	authenticated, userID := isAuthenticated(c)

	if !authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to get workspaces"})
		return
	}

	workspaces, err := getUserWorkspaces(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch workspaces"})
		return
	}

	c.JSON(http.StatusOK, GetWorkspacesResponse{Workspaces: workspaces})
}

func deleteWorkspaceHandler(c *gin.Context) {
	workspaceID := c.Param("id")
	if workspaceID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Workspace ID is required"})
		return
	}

	authenticated, userID := isAuthenticated(c)

	if !authenticated {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required to delete workspaces"})
		return
	}

	err := deleteUserWorkspace(userID, workspaceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Workspace deleted successfully"})
}

func saveUserWorkspace(userID uint, req SaveWorkspaceRequest) error {
	if DB == nil {
		return fmt.Errorf("database not available")
	}

	stateData := WorkspaceStateData{
		Colors:             req.Colors,
		Selectors:          req.Selectors,
		DrawSelectionValue: req.DrawSelectionValue,
		ActiveSelectorId:   req.ActiveSelectorId,
		FilteredColors:     req.FilteredColors,
		SampleRate:         req.SampleRate,
		Luminosity:         req.Luminosity,
		Nearest:            req.Nearest,
		Power:              req.Power,
		MaxDistance:        req.MaxDistance,
	}

	stateJSON, err := json.Marshal(stateData)
	if err != nil {
		return err
	}

	dbWorkspace := Workspace{
		UserID:    &userID,
		Name:      req.Name,
		JsonData:  string(stateJSON),
		ImageData: req.ImageData,
	}

	return DB.Create(&dbWorkspace).Error
}

func getUserWorkspaces(userID uint) ([]WorkspaceData, error) {
	if DB == nil {
		return nil, fmt.Errorf("database not available")
	}

	var dbWorkspaces []Workspace
	err := DB.Where("user_id = ?", userID).
		Order("created_at DESC").
		Find(&dbWorkspaces).Error
	if err != nil {
		return nil, err
	}

	workspaces := make([]WorkspaceData, len(dbWorkspaces))
	for i, dbWorkspace := range dbWorkspaces {
		var state WorkspaceStateData
		if err := json.Unmarshal([]byte(dbWorkspace.JsonData), &state); err != nil {
			continue
		}

		workspaces[i] = WorkspaceData{
			ID:                 fmt.Sprintf("%d", dbWorkspace.ID),
			Name:               dbWorkspace.Name,
			ImageData:          dbWorkspace.ImageData,
			Colors:             state.Colors,
			Selectors:          state.Selectors,
			DrawSelectionValue: state.DrawSelectionValue,
			ActiveSelectorId:   state.ActiveSelectorId,
			FilteredColors:     state.FilteredColors,
			SampleRate:         state.SampleRate,
			Luminosity:         state.Luminosity,
			Nearest:            state.Nearest,
			Power:              state.Power,
			MaxDistance:        state.MaxDistance,
			CreatedAt:          dbWorkspace.CreatedAt.Format("2006-01-02T15:04:05.000Z"),
		}
	}

	return workspaces, nil
}

func deleteUserWorkspace(userID uint, workspaceID string) error {
	if DB == nil {
		return fmt.Errorf("database not available")
	}

	var workspace Workspace
	if err := DB.Where("id = ? AND user_id = ?", workspaceID, userID).First(&workspace).Error; err != nil {
		return fmt.Errorf("workspace not found or unauthorized")
	}

	result := DB.Delete(&workspace)
	if result.Error != nil {
		return result.Error
	}

	return nil
}
