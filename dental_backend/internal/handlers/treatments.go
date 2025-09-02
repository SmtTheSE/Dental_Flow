// dental_backend/internal/handlers/treatment_handlers.go
package handlers

import (
	"dental_backend/internal/database"
	"dental_backend/internal/models"
	"dental_backend/internal/services"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

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
