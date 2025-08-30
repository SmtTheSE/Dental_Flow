// dental_backend/internal/models/patient.go
package models

import (
	"time"
)

// Patient represents a patient in the system
type Patient struct {
	ID                    int       `json:"id" db:"id"`
	FirstName             string    `json:"firstName" db:"first_name"`
	LastName              string    `json:"lastName" db:"last_name"`
	DateOfBirth           string    `json:"dateOfBirth" db:"date_of_birth"`
	Phone                 string    `json:"phone" db:"phone"`
	Email                 string    `json:"email" db:"email"`
	Address               string    `json:"address" db:"address"`
	EmergencyContact      string    `json:"emergencyContact" db:"emergency_contact"`
	InsuranceProvider     string    `json:"insuranceProvider" db:"insurance_provider"`
	InsurancePolicyNumber string    `json:"insurancePolicyNumber" db:"insurance_policy_number"`
	MedicalHistory        string    `json:"medicalHistory" db:"medical_history"`
	RiskLevel             string    `json:"riskLevel" db:"risk_level"`
	CreatedAt             time.Time `json:"createdAt" db:"created_at"`
	UpdatedAt             time.Time `json:"updatedAt" db:"updated_at"`
}

// RiskLevel represents the risk level of a patient
type RiskLevel string

const (
	RiskLevelLow    RiskLevel = "low"
	RiskLevelMedium RiskLevel = "medium"
	RiskLevelHigh   RiskLevel = "high"
)

// CreatePatientRequest represents the request payload for creating a patient
type CreatePatientRequest struct {
	FirstName             string `json:"firstName" binding:"required"`
	LastName              string `json:"lastName" binding:"required"`
	DateOfBirth           string `json:"dateOfBirth" binding:"required"`
	Phone                 string `json:"phone" binding:"required"`
	Email                 string `json:"email" binding:"required,email"`
	Address               string `json:"address"`
	EmergencyContact      string `json:"emergencyContact"`
	InsuranceProvider     string `json:"insuranceProvider"`
	InsurancePolicyNumber string `json:"insurancePolicyNumber"`
	MedicalHistory        string `json:"medicalHistory"`
	RiskLevel             string `json:"riskLevel" binding:"required,oneof=low medium high"`
}

// UpdatePatientRequest represents the request payload for updating a patient
type UpdatePatientRequest struct {
	FirstName             string `json:"firstName"`
	LastName              string `json:"lastName"`
	DateOfBirth           string `json:"dateOfBirth"`
	Phone                 string `json:"phone"`
	Email                 string `json:"email" binding:"email"`
	Address               string `json:"address"`
	EmergencyContact      string `json:"emergencyContact"`
	InsuranceProvider     string `json:"insuranceProvider"`
	InsurancePolicyNumber string `json:"insurancePolicyNumber"`
	MedicalHistory        string `json:"medicalHistory"`
	RiskLevel             string `json:"riskLevel" binding:"oneof=low medium high"`
}
