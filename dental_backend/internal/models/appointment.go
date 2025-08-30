// dental_backend/internal/models/appointment.go
package models

import (
	"time"
)

// Appointment represents an appointment in the system
type Appointment struct {
	ID              int       `json:"id" db:"id"`
	PatientID       int       `json:"patientId" db:"patient_id"`
	DentistID       int       `json:"dentistId" db:"dentist_id"`
	PatientName     string    `json:"patientName" db:"patient_name"`
	DentistName     string    `json:"dentistName" db:"dentist_name"`
	AppointmentDate string    `json:"appointmentDate" db:"appointment_date"`
	StartTime       string    `json:"startTime" db:"start_time"`
	EndTime         string    `json:"endTime" db:"end_time"`
	Status          string    `json:"status" db:"status"`
	Notes           string    `json:"notes" db:"notes"`
	CreatedAt       time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt       time.Time `json:"updatedAt" db:"updated_at"`
}

// AppointmentStatus represents the status of an appointment
type AppointmentStatus string

const (
	AppointmentStatusScheduled AppointmentStatus = "scheduled"
	AppointmentStatusCompleted AppointmentStatus = "completed"
	AppointmentStatusCancelled AppointmentStatus = "cancelled"
	AppointmentStatusNoShow    AppointmentStatus = "no-show"
)

// CreateAppointmentRequest represents the request payload for creating an appointment
type CreateAppointmentRequest struct {
	PatientID       int    `json:"patientId" binding:"required"`
	DentistID       int    `json:"dentistId" binding:"required"`
	AppointmentDate string `json:"appointmentDate" binding:"required"`
	StartTime       string `json:"startTime" binding:"required"`
	EndTime         string `json:"endTime" binding:"required"`
	Status          string `json:"status" binding:"oneof=scheduled completed cancelled no-show"`
	Notes           string `json:"notes"`
}

// UpdateAppointmentRequest represents the request payload for updating an appointment
type UpdateAppointmentRequest struct {
	PatientID       int    `json:"patientId"`
	DentistID       int    `json:"dentistId"`
	AppointmentDate string `json:"appointmentDate"`
	StartTime       string `json:"startTime"`
	EndTime         string `json:"endTime"`
	Status          string `json:"status" binding:"oneof=scheduled completed cancelled no-show"`
	Notes           string `json:"notes"`
}
