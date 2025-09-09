// dental_backend/internal/handlers/treatment_handlers.go
package handlers

import (
	"dental_backend/internal/database"
	"dental_backend/internal/models"
	"dental_backend/internal/services"
	"net/http"
	"strconv"
	"os"
	"bytes"
	"io"
	"mime/multipart"
	"path/filepath"
	"encoding/json"

	"github.com/gin-gonic/gin"
)

// ToothAnalysisResponse represents the response structure for tooth analysis
type ToothAnalysisResponse struct {
	PatientID         string                      `json:"patientId"`
	Findings          []ToothAnalysisFinding      `json:"findings"`
	AnnotatedImageURL string                      `json:"annotatedImageUrl"`
}

// ToothAnalysisFinding represents a single finding from the tooth analysis
type ToothAnalysisFinding struct {
	ID          int    `json:"id"`
	Description string `json:"description"`
}

// GetTreatments handles GET /api/treatments
func GetTreatments(c *gin.Context) {
	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Get all treatments
	treatments, err := treatmentService.GetAllTreatments()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve treatments"})
		return
	}

	c.JSON(http.StatusOK, treatments)
}

// GetTreatment handles GET /api/treatments/:id
func GetTreatment(c *gin.Context) {
	// Parse treatment ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Get treatment by ID
	treatment, err := treatmentService.GetTreatmentByID(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve treatment"})
		return
	}

	if treatment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Treatment not found"})
		return
	}

	c.JSON(http.StatusOK, treatment)
}

// CreateTreatment handles POST /api/treatments
func CreateTreatment(c *gin.Context) {
	var req models.CreateTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Create treatment
	treatment, err := treatmentService.CreateTreatment(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create treatment"})
		return
	}

	c.JSON(http.StatusCreated, treatment)
}

// UpdateTreatment handles PUT /api/treatments/:id
func UpdateTreatment(c *gin.Context) {
	// Parse treatment ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	var req models.UpdateTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Update treatment
	treatment, err := treatmentService.UpdateTreatment(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update treatment"})
		return
	}

	if treatment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Treatment not found"})
		return
	}

	c.JSON(http.StatusOK, treatment)
}

// DeleteTreatment handles DELETE /api/treatments/:id
func DeleteTreatment(c *gin.Context) {
	// Parse treatment ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Delete treatment
	err = treatmentService.DeleteTreatment(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete treatment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Treatment deleted successfully"})
}

// GetTreatmentQueue handles GET /api/treatments/queue
func GetTreatmentQueue(c *gin.Context) {
	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Get treatment queue
	treatments, err := treatmentService.GetTreatmentQueue()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve treatment queue"})
		return
	}

	c.JSON(http.StatusOK, treatments)
}

// GetPatientTreatments handles GET /api/patients/:id/treatments
func GetPatientTreatments(c *gin.Context) {
	// Parse patient ID
	idStr := c.Param("id")
	patientID, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Get patient treatments
	treatments, err := treatmentService.GetPatientTreatments(patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve patient treatments"})
		return
	}

	c.JSON(http.StatusOK, treatments)
}

// CreatePatientTreatment handles POST /api/patient-treatments
func CreatePatientTreatment(c *gin.Context) {
	var req models.CreatePatientTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get dentist ID from context (set by auth middleware)
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	dentistIDInt, ok := dentistID.(int)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid dentist ID"})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Create patient treatment
	treatment, err := treatmentService.CreatePatientTreatment(req, dentistIDInt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient treatment"})
		return
	}

	c.JSON(http.StatusCreated, treatment)
}

// UpdatePatientTreatment handles PUT /api/patient-treatments/:id
func UpdatePatientTreatment(c *gin.Context) {
	// Parse treatment ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	var req models.UpdatePatientTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Update patient treatment
	treatment, err := treatmentService.UpdatePatientTreatment(id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient treatment"})
		return
	}

	if treatment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient treatment not found"})
		return
	}

	c.JSON(http.StatusOK, treatment)
}

// DeletePatientTreatment handles DELETE /api/patient-treatments/:id
func DeletePatientTreatment(c *gin.Context) {
	// Parse treatment ID
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	// Get database connection
	db := database.GetDB()
	if db == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database connection not available"})
		return
	}

	// Create treatment service
	treatmentService := services.NewTreatmentService(db)

	// Delete patient treatment
	err = treatmentService.DeletePatientTreatment(id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete patient treatment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient treatment deleted successfully"})
}

// AnalyzeTooth handles POST /api/tooth-analysis
func AnalyzeTooth(c *gin.Context) {
	// Parse form data
	patientIDStr := c.PostForm("patientId")
	patientID, err := strconv.Atoi(patientIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	// Get the uploaded file
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	// Validate file type (should be PNG or JPG)
	if file.Header.Get("Content-Type") != "image/png" && 
	   file.Header.Get("Content-Type") != "image/jpeg" &&
	   file.Header.Get("Content-Type") != "image/jpg" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only PNG and JPG images are supported"})
		return
	}

	// Save file to temporary location
	tempFile := filepath.Join(os.TempDir(), file.Filename)
	if err := c.SaveUploadedFile(file, tempFile); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}
	defer os.Remove(tempFile) // Clean up

	// Forward to Python ML service
	mlServiceURL := os.Getenv("ML_SERVICE_URL")
	if mlServiceURL == "" {
		mlServiceURL = "http://localhost:8000" // Default URL
	}

	// Create multipart form data to send to ML service
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Open the temporary file
	fileReader, err := os.Open(tempFile)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read image"})
		return
	}
	defer fileReader.Close()

	// Create form file field
	part, err := writer.CreateFormFile("image", file.Filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create form file"})
		return
	}

	// Copy file data to form
	_, err = io.Copy(part, fileReader)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to copy file data"})
		return
	}

	// Close writer to finalize multipart form
	err = writer.Close()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create form data"})
		return
	}

	// Send request to ML service
	resp, err := http.Post(mlServiceURL+"/analyze", writer.FormDataContentType(), &buf)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to ML service: " + err.Error()})
		return
	}
	defer resp.Body.Close()

	// Add debug info to response headers
	c.Header("X-ML-Service-Status", strconv.Itoa(resp.StatusCode))

	// Check if the request was successful
	if resp.StatusCode != http.StatusOK {
		// Try to read the error response
		respBody, _ := io.ReadAll(resp.Body)
		c.JSON(resp.StatusCode, gin.H{"error": "ML service error: " + string(respBody)})
		return
	}

	// Parse the response from ML service
	var mlResponse struct {
		Findings          []string `json:"findings"`
		AnnotatedImageURL string   `json:"annotatedImageUrl"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&mlResponse); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse ML service response"})
		return
	}

	// Add debug info to response headers
	c.Header("X-ML-Response-Data", "received")

	// Convert to our response format
	var findings []ToothAnalysisFinding
	for i, finding := range mlResponse.Findings {
		findings = append(findings, ToothAnalysisFinding{
			ID:          i + 1,
			Description: finding,
		})
	}

	response := ToothAnalysisResponse{
		PatientID:         strconv.Itoa(patientID),
		Findings:          findings,
		AnnotatedImageURL: mlResponse.AnnotatedImageURL,
	}

	c.JSON(http.StatusOK, response)
}
