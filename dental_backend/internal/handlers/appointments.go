// dental_backend/internal/handlers/appointments.go
package handlers

import (
	"log"
	"net/http"
	"strconv"

	"dental_backend/internal/database" // Import the shared database package
	"dental_backend/internal/models"
	"dental_backend/internal/services"

	"github.com/gin-gonic/gin"
)

// GetTodaysAppointments retrieves all appointments for today
func GetTodaysAppointments(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get today's appointments from service
	appointments, err := appointmentService.GetTodaysAppointments()
	if err != nil {
		log.Printf("Error retrieving today's appointments: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

// GetAppointments retrieves all appointments with optional filtering
func GetAppointments(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get query parameters for filtering
	date := c.Query("date")
	status := c.Query("status")
	patientID := c.Query("patientId")

	// Get appointments from service
	appointments, err := appointmentService.GetAllAppointments(date, status, patientID)
	if err != nil {
		log.Printf("Error retrieving appointments: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointments", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, appointments)
}

// GetAppointment retrieves a single appointment by ID
func GetAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	id := c.Param("id")
	appointmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Get appointment from service
	appointment, err := appointmentService.GetAppointmentByID(appointmentID)
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

// CreateAppointment creates a new appointment
func CreateAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	var req models.CreateAppointmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Create appointment through service
	newAppointment, err := appointmentService.CreateAppointment(req)
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

// UpdateAppointment updates an existing appointment
func UpdateAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

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
	updatedAppointment, err := appointmentService.UpdateAppointment(appointmentID, req)
	if err != nil {
		// Check if it's a validation error
		if _, ok := err.(*services.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Check if appointment was not found
		if err != nil && err.Error() == "sql: no rows in result set" {
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

// DeleteAppointment deletes an appointment by ID
func DeleteAppointment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	id := c.Param("id")
	appointmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid appointment ID"})
		return
	}

	// Delete appointment through service
	err = appointmentService.DeleteAppointment(appointmentID)
	if err != nil {
		if err != nil && err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Appointment not found"})
			return
		}
		log.Printf("Error deleting appointment: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete appointment", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Appointment deleted successfully"})
}

// GetAppointmentStats retrieves appointment statistics
func GetAppointmentStats(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create appointment service
	appointmentService := services.NewAppointmentService(db)

	// Get appointment stats from service
	stats, err := appointmentService.GetAppointmentStats()
	if err != nil {
		log.Printf("Error retrieving appointment stats: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve appointment statistics", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, stats)
}
