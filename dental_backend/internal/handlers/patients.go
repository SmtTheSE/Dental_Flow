// dental_backend/internal/handlers/patients.go
package handlers

import (
	"net/http"
	"strconv"

	"dental_backend/internal/database"
	"dental_backend/internal/models"
	"dental_backend/internal/services"

	"github.com/gin-gonic/gin"
)

// GetPatients retrieves all patients with optional filtering
func GetPatients(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create patient service
	patientService := services.NewPatientService(db)

	// Get query parameters for filtering
	search := c.Query("search")
	status := c.Query("status")

	// Get patients from service
	patients, err := patientService.GetAllPatients(search, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve patients"})
		return
	}

	c.JSON(http.StatusOK, patients)
}

// GetPatient retrieves a single patient by ID
func GetPatient(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create patient service
	patientService := services.NewPatientService(db)

	id := c.Param("id")
	patientID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	// Get patient from service
	patient, err := patientService.GetPatientByID(patientID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve patient"})
		return
	}

	if patient == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	c.JSON(http.StatusOK, patient)
}

// CreatePatient creates a new patient
func CreatePatient(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create patient service
	patientService := services.NewPatientService(db)

	var req models.CreatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create patient through service
	newPatient, err := patientService.CreatePatient(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient"})
		return
	}

	c.JSON(http.StatusCreated, newPatient)
}

// UpdatePatient updates an existing patient
func UpdatePatient(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create patient service
	patientService := services.NewPatientService(db)

	id := c.Param("id")
	patientID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	var req models.UpdatePatientRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update patient through service
	updatedPatient, err := patientService.UpdatePatient(patientID, req)
	if err != nil {
		if err != nil && err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	c.JSON(http.StatusOK, updatedPatient)
}

// DeletePatient deletes a patient by ID
func DeletePatient(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create patient service
	patientService := services.NewPatientService(db)

	id := c.Param("id")
	patientID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	// Delete patient through service
	err = patientService.DeletePatient(patientID)
	if err != nil {
		if err != nil && err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete patient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient deleted successfully"})
}

// GetPatientStats retrieves patient statistics
func GetPatientStats(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create patient service
	patientService := services.NewPatientService(db)

	// Get patient stats from service
	stats, err := patientService.GetPatientStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve patient statistics"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
