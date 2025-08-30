// internal/models/billing_models.go

package models

import (
	"time"
)

// BillingStats represents billing statistics for dashboard
type BillingStats struct {
	MonthlyRevenue  float64 `json:"monthly_revenue"`
	PendingPayments float64 `json:"pending_payments"`
	InsuranceClaims float64 `json:"insurance_claims"`
	Collections     float64 `json:"collections"`
}

// Invoice represents a billing invoice
type Invoice struct {
	ID            int       `json:"id"`
	PatientID     int       `json:"patient_id"`
	PatientName   string    `json:"patient_name"`
	Amount        float64   `json:"amount"`
	Status        string    `json:"status"`
	DueDate       string    `json:"due_date"`
	IssuedDate    string    `json:"issued_date"`
	PaymentMethod string    `json:"payment_method"`
	Notes         string    `json:"notes"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// CreateInvoiceRequest represents the request body for creating an invoice
type CreateInvoiceRequest struct {
	PatientID     int     `json:"patient_id" binding:"required"`
	Amount        float64 `json:"amount" binding:"required"`
	Status        string  `json:"status"`
	DueDate       string  `json:"due_date" binding:"required"`
	IssuedDate    string  `json:"issued_date"`
	PaymentMethod string  `json:"payment_method"`
	Notes         string  `json:"notes"`
}

// UpdateInvoiceRequest represents the request body for updating an invoice
type UpdateInvoiceRequest struct {
	PatientID     int     `json:"patient_id"`
	Amount        float64 `json:"amount"`
	Status        string  `json:"status"`
	DueDate       string  `json:"due_date"`
	IssuedDate    string  `json:"issued_date"`
	PaymentMethod string  `json:"payment_method"`
	Notes         string  `json:"notes"`
}

// InsuranceClaim represents an insurance claim
type InsuranceClaim struct {
	ID             int       `json:"id"`
	PatientID      int       `json:"patient_id"`
	PatientName    string    `json:"patient_name"`
	TreatmentID    *int      `json:"treatment_id"`
	TreatmentName  *string   `json:"treatment_name"`
	ClaimAmount    float64   `json:"claim_amount"`
	Status         string    `json:"status"`
	SubmissionDate string    `json:"submission_date"`
	ApprovalDate   *string   `json:"approval_date"`
	Notes          string    `json:"notes"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// CreateInsuranceClaimRequest represents the request body for creating an insurance claim
type CreateInsuranceClaimRequest struct {
	PatientID      int     `json:"patient_id" binding:"required"`
	TreatmentID    *int    `json:"treatment_id"`
	ClaimAmount    float64 `json:"claim_amount" binding:"required"`
	Status         string  `json:"status"`
	SubmissionDate string  `json:"submission_date"`
	ApprovalDate   *string `json:"approval_date"`
	Notes          string  `json:"notes"`
}

// UpdateInsuranceClaimRequest represents the request body for updating an insurance claim
type UpdateInsuranceClaimRequest struct {
	PatientID      int     `json:"patient_id"`
	TreatmentID    *int    `json:"treatment_id"`
	ClaimAmount    float64 `json:"claim_amount"`
	Status         string  `json:"status"`
	SubmissionDate string  `json:"submission_date"`
	ApprovalDate   *string `json:"approval_date"`
	Notes          string  `json:"notes"`
}
