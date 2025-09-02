// dental_backend/internal/models/treatment.go
package models

import (
	"time"
)

// Treatment represents a treatment in the system
type Treatment struct {
	ID          int     `json:"id" db:"id"`
	Name        string  `json:"name" db:"name"`
	Description string  `json:"description" db:"description"`
	Cost        float64 `json:"cost" db:"cost"`
	Duration    int     `json:"duration" db:"duration_minutes"` // in minutes
	Category    string  `json:"category" db:"category"`
	// Removed CreatedAt and UpdatedAt since they don't exist in the database
}

// PatientTreatment represents a patient's treatment record
type PatientTreatment struct {
	ID             int       `json:"id" db:"id"`
	PatientID      int       `json:"patientId" db:"patient_id"`
	TreatmentID    int       `json:"treatmentId" db:"treatment_id"`
	DentistID      *int      `json:"dentistId" db:"dentist_id"` // nullable
	PatientName    string    `json:"patientName" db:"patient_name"`
	TreatmentName  string    `json:"treatmentName" db:"treatment_name"`
	DentistName    *string   `json:"dentistName" db:"dentist_name"` // nullable
	Status         string    `json:"status" db:"status"`
	Priority       string    `json:"priority" db:"priority"`
	StartDate      string    `json:"startDate" db:"start_date"`
	CompletionDate *string   `json:"completionDate" db:"completion_date"` // nullable
	Notes          string    `json:"notes" db:"notes"`
	CreatedAt      time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt      time.Time `json:"updatedAt" db:"updated_at"`
}

// TreatmentCategory represents the category of a treatment
type TreatmentCategory string

const (
	TreatmentCategoryGeneral      TreatmentCategory = "General"
	TreatmentCategoryCleaning     TreatmentCategory = "Cleaning"
	TreatmentCategoryFilling      TreatmentCategory = "Filling"
	TreatmentCategoryCrown        TreatmentCategory = "Crown"
	TreatmentCategoryRootCanal    TreatmentCategory = "Root Canal"
	TreatmentCategorySurgery      TreatmentCategory = "Surgery"
	TreatmentCategoryOrthodontics TreatmentCategory = "Orthodontics"
)

// PatientTreatmentStatus represents the status of a patient's treatment
type PatientTreatmentStatus string

const (
	PatientTreatmentStatusPending    PatientTreatmentStatus = "pending"
	PatientTreatmentStatusInProgress PatientTreatmentStatus = "in-progress"
	PatientTreatmentStatusCompleted  PatientTreatmentStatus = "completed"
)

// PatientTreatmentPriority represents the priority of a patient's treatment
type PatientTreatmentPriority string

const (
	PatientTreatmentPriorityLow    PatientTreatmentPriority = "low"
	PatientTreatmentPriorityNormal PatientTreatmentPriority = "normal"
	PatientTreatmentPriorityHigh   PatientTreatmentPriority = "high"
	PatientTreatmentPriorityUrgent PatientTreatmentPriority = "urgent"
)

// CreateTreatmentRequest represents the request payload for creating a treatment
type CreateTreatmentRequest struct {
	Name        string  `json:"name" binding:"required"`
	Description string  `json:"description"`
	Cost        float64 `json:"cost" binding:"required,min=0"`
	Duration    int     `json:"duration" binding:"required,min=1"`
	Category    string  `json:"category"`
}

// UpdateTreatmentRequest represents the request payload for updating a treatment
type UpdateTreatmentRequest struct {
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Cost        float64 `json:"cost" binding:"min=0"`
	Duration    int     `json:"duration" binding:"min=1"`
	Category    string  `json:"category"`
}

// CreatePatientTreatmentRequest represents the request payload for creating a patient treatment
type CreatePatientTreatmentRequest struct {
	PatientID      int     `json:"patientId" binding:"required"`
	TreatmentID    int     `json:"treatmentId" binding:"required"`
	DentistID      *int    `json:"dentistId"`
	Status         string  `json:"status" binding:"oneof=pending in-progress completed"`
	Priority       string  `json:"priority" binding:"oneof=low normal high urgent"`
	StartDate      string  `json:"startDate" binding:"required"`
	CompletionDate *string `json:"completionDate"`
	Notes          string  `json:"notes"`
}

// UpdatePatientTreatmentRequest represents the request payload for updating a patient treatment
type UpdatePatientTreatmentRequest struct {
	PatientID      int     `json:"patientId"`
	TreatmentID    int     `json:"treatmentId"`
	DentistID      *int    `json:"dentistId"`
	Status         string  `json:"status" binding:"oneof=pending in-progress completed"`
	Priority       string  `json:"priority" binding:"oneof=low normal high urgent"`
	StartDate      string  `json:"startDate"`
	CompletionDate *string `json:"completionDate"`
	Notes          string  `json:"notes"`
}
