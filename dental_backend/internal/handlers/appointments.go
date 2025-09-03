// dental_backend/internal/handlers/appointments.go
package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"strconv"

	"dental_backend/internal/database" // Import the shared database package
	"dental_backend/internal/models"
	"dental_backend/internal/services"

	"github.com/gin-gonic/gin"
)

// GetTodaysAppointments retrieves all appointments for today for the logged-in dentist
func GetTodaysAppointments(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get logged-in dentist ID from context
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get today's appointments from service
	appointments, err := appointmentService.GetTodaysAppointments(dentistID.(int))
	if err != nil {
		log.Printf("Error retrieving today's appointments: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointments", "details": err.Error()})
		return
	}

	// Ensure we always return an array, even if empty
	if appointments == nil {
		appointments = []models.Appointment{}
	}

	c.JSON(http.StatusOK, appointments)
}

// GetAppointments retrieves all appointments with optional filtering for the logged-in dentist
func GetAppointments(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get logged-in dentist ID from context
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get query parameters for filtering
	date := c.Query("date")
	status := c.Query("status")
	patientIDStr := c.Query("patientId")

	// Convert parameters to pointers as expected by the service method
	var datePtr *string
	var statusPtr *string
	var patientIDPtr *int

	if date != "" {
		datePtr = &date
	}

	if status != "" {
		statusPtr = &status
	}

	if patientIDStr != "" {
		patientIDInt, err := strconv.Atoi(patientIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
			return
		}
		patientIDPtr = &patientIDInt
	}

	// Get appointments from service
	appointments, err := appointmentService.GetAllAppointments(dentistID.(int), datePtr, statusPtr, patientIDPtr)
	if err != nil {
		log.Printf("Error retrieving appointments: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointments", "details": err.Error()})
		return
	}

	// Ensure we always return an array, even if empty
	if appointments == nil {
		appointments = []models.Appointment{}
	}

	c.JSON(http.StatusOK, appointments)
}

// GetAppointment retrieves a single appointment by ID for the logged-in dentist
func GetAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get logged-in dentist ID from context
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	appointmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Get appointment from service
	appointment, err := appointmentService.GetAppointmentByID(appointmentID, dentistID.(int))
	if err != nil {
		log.Printf("Error retrieving appointment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointment", "details": err.Error()})
		return
	}

	if appointment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, appointment)
}

// CreateAppointment creates a new appointment associated with the logged-in dentist
func CreateAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get logged-in dentist ID from context
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req models.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create appointment through service
	newAppointment, err := appointmentService.CreateAppointment(req, dentistID.(int))
	if err != nil {
		// Check if it's a validation error
		if _, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		log.Printf("Error creating appointment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create appointment", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, newAppointment)
}

// UpdateAppointment updates an existing appointment for the logged-in dentist
func UpdateAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get logged-in dentist ID from context
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	appointmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	var req models.UpdateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update appointment through service
	updatedAppointment, err := appointmentService.UpdateAppointment(appointmentID, req, dentistID.(int))
	if err != nil {
		// Check if it's a validation error
		if _, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Check if appointment was not found
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}
		log.Printf("Error updating appointment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update appointment", "details": err.Error()})
		return
	}

	if updatedAppointment == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
		return
	}

	c.JSON(http.StatusOK, updatedAppointment)
}

// DeleteAppointment deletes an appointment for the logged-in dentist
func DeleteAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get logged-in dentist ID from context
	dentistID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	id := c.Param("id")
	appointmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Delete appointment through service
	err = appointmentService.DeleteAppointment(appointmentID, dentistID.(int))
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}
		log.Printf("Error deleting appointment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment deleted successfully"})
}