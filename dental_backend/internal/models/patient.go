// dental_backend/internal/models/patient.go
package models

import (
	"time"
)

// Patient represents a patient in the system
type Patient struct {
	ID                int       `json:"id" db:"id"`
	Name              string    `json:"name" db:"name"`
	Age               int       `json:"age" db:"age"`
	Phone             string    `json:"phone" db:"phone"`
	Email             string    `json:"email" db:"email"`
	LastVisit         string    `json:"lastVisit" db:"last_visit"`
	NextAppointment   *string   `json:"nextAppointment" db:"next_appointment"`
	TreatmentStatus   string    `json:"treatmentStatus" db:"treatment_status"`
	RiskLevel         string    `json:"riskLevel" db:"risk_level"`
	InsuranceProvider string    `json:"insuranceProvider" db:"insurance_provider"`
	CreatedAt         time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt         time.Time `json:"updatedAt" db:"updated_at"`
}

// PatientTreatmentStatus represents the status of a patient's treatment
type PatientTreatmentStatus string

const (
	TreatmentStatusPending   PatientTreatmentStatus = "pending"
	TreatmentStatusActive    PatientTreatmentStatus = "active"
	TreatmentStatusCompleted PatientTreatmentStatus = "completed"
)

// RiskLevel represents the risk level of a patient
type RiskLevel string

const (
	RiskLevelLow    RiskLevel = "low"
	RiskLevelMedium RiskLevel = "medium"
	RiskLevelHigh   RiskLevel = "high"
)

// CreatePatientRequest represents the request payload for creating a patient
type CreatePatientRequest struct {
	Name              string `json:"name" binding:"required"`
	Age               int    `json:"age" binding:"required,min=1,max=120"`
	Phone             string `json:"phone" binding:"required"`
	Email             string `json:"email" binding:"required,email"`
	LastVisit         string `json:"lastVisit"`
	NextAppointment   string `json:"nextAppointment"`
	TreatmentStatus   string `json:"treatmentStatus" binding:"required,oneof=active completed pending"`
	RiskLevel         string `json:"riskLevel" binding:"required,oneof=low medium high"`
	InsuranceProvider string `json:"insuranceProvider"`
}

// UpdatePatientRequest represents the request payload for updating a patient
type UpdatePatientRequest struct {
	Name              string `json:"name"`
	Age               int    `json:"age" binding:"min=1,max=120"`
	Phone             string `json:"phone"`
	Email             string `json:"email" binding:"email"`
	LastVisit         string `json:"lastVisit"`
	NextAppointment   string `json:"nextAppointment"`
	TreatmentStatus   string `json:"treatmentStatus" binding:"oneof=active completed pending"`
	RiskLevel         string `json:"riskLevel" binding:"oneof=low medium high"`
	InsuranceProvider string `json:"insuranceProvider"`
}
