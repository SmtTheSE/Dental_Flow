// dental_backend/internal/handlers/billing.go
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"dental_backend/internal/database"
	"dental_backend/internal/models"
	"dental_backend/internal/services"

	"github.com/gin-gonic/gin"
)

// GetBillingStats retrieves billing statistics for the dashboard
func GetBillingStats(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	// Get billing stats from service
	stats, err := billingService.GetBillingStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve billing statistics"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		MonthlyRevenue  float64 `json:"monthlyRevenue"`
		PendingPayments float64 `json:"pendingPayments"`
		InsuranceClaims float64 `json:"insuranceClaims"`
		Collections     float64 `json:"collections"`
	}{
		MonthlyRevenue:  stats.MonthlyRevenue,
		PendingPayments: stats.PendingPayments,
		InsuranceClaims: stats.InsuranceClaims,
		Collections:     stats.Collections,
	}

	c.JSON(http.StatusOK, response)
}

// GetInvoices retrieves all invoices with optional filtering
func GetInvoices(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	// Get query parameters for filtering
	status := c.Query("status")
	patientID := c.Query("patientId")

	// Get invoices from service
	var patientIDFilter string
	if patientID != "" {
		patientIDFilter = patientID
	}

	invoices, err := billingService.GetAllInvoices(status, patientIDFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
		return
	}

	// Convert service models to handler response format
	response := make([]struct {
		ID            int       `json:"id"`
		PatientID     int       `json:"patientId"`
		PatientName   string    `json:"patientName"`
		Amount        float64   `json:"amount"`
		Status        string    `json:"status"`
		DueDate       string    `json:"dueDate"`
		IssuedDate    string    `json:"issuedDate"`
		PaymentMethod string    `json:"paymentMethod"`
		Notes         string    `json:"notes"`
		CreatedAt     time.Time `json:"createdAt"`
		UpdatedAt     time.Time `json:"updatedAt"`
	}, len(invoices))

	for i, invoice := range invoices {
		response[i] = struct {
			ID            int       `json:"id"`
			PatientID     int       `json:"patientId"`
			PatientName   string    `json:"patientName"`
			Amount        float64   `json:"amount"`
			Status        string    `json:"status"`
			DueDate       string    `json:"dueDate"`
			IssuedDate    string    `json:"issuedDate"`
			PaymentMethod string    `json:"paymentMethod"`
			Notes         string    `json:"notes"`
			CreatedAt     time.Time `json:"createdAt"`
			UpdatedAt     time.Time `json:"updatedAt"`
		}{
			ID:            invoice.ID,
			PatientID:     invoice.PatientID,
			PatientName:   invoice.PatientName,
			Amount:        invoice.Amount,
			Status:        invoice.Status,
			DueDate:       invoice.DueDate,
			IssuedDate:    invoice.IssuedDate,
			PaymentMethod: invoice.PaymentMethod,
			Notes:         invoice.Notes,
			CreatedAt:     invoice.CreatedAt,
			UpdatedAt:     invoice.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetInvoice retrieves a single invoice by ID
func GetInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	id := c.Param("id")
	invoiceID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	// Get invoice from service
	invoice, err := billingService.GetInvoiceByID(invoiceID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice"})
		return
	}

	if invoice == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		ID            int       `json:"id"`
		PatientID     int       `json:"patientId"`
		PatientName   string    `json:"patientName"`
		Amount        float64   `json:"amount"`
		Status        string    `json:"status"`
		DueDate       string    `json:"dueDate"`
		IssuedDate    string    `json:"issuedDate"`
		PaymentMethod string    `json:"paymentMethod"`
		Notes         string    `json:"notes"`
		CreatedAt     time.Time `json:"createdAt"`
		UpdatedAt     time.Time `json:"updatedAt"`
	}{
		ID:            invoice.ID,
		PatientID:     invoice.PatientID,
		PatientName:   invoice.PatientName,
		Amount:        invoice.Amount,
		Status:        invoice.Status,
		DueDate:       invoice.DueDate,
		IssuedDate:    invoice.IssuedDate,
		PaymentMethod: invoice.PaymentMethod,
		Notes:         invoice.Notes,
		CreatedAt:     invoice.CreatedAt,
		UpdatedAt:     invoice.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// CreateInvoice creates a new invoice
func CreateInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	var req models.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values if not provided
	if req.Status == "" {
		req.Status = "pending"
	}

	if req.IssuedDate == "" {
		req.IssuedDate = time.Now().Format("2006-01-02")
	}

	// Create invoice through service
	newInvoice, err := billingService.CreateInvoice(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		ID            int       `json:"id"`
		PatientID     int       `json:"patientId"`
		PatientName   string    `json:"patientName"`
		Amount        float64   `json:"amount"`
		Status        string    `json:"status"`
		DueDate       string    `json:"dueDate"`
		IssuedDate    string    `json:"issuedDate"`
		PaymentMethod string    `json:"paymentMethod"`
		Notes         string    `json:"notes"`
		CreatedAt     time.Time `json:"createdAt"`
		UpdatedAt     time.Time `json:"updatedAt"`
	}{
		ID:            newInvoice.ID,
		PatientID:     newInvoice.PatientID,
		PatientName:   newInvoice.PatientName,
		Amount:        newInvoice.Amount,
		Status:        newInvoice.Status,
		DueDate:       newInvoice.DueDate,
		IssuedDate:    newInvoice.IssuedDate,
		PaymentMethod: newInvoice.PaymentMethod,
		Notes:         newInvoice.Notes,
		CreatedAt:     newInvoice.CreatedAt,
		UpdatedAt:     newInvoice.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateInvoice updates an existing invoice
func UpdateInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	id := c.Param("id")
	invoiceID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req models.UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update invoice through service
	updatedInvoice, err := billingService.UpdateInvoice(invoiceID, req)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		ID            int       `json:"id"`
		PatientID     int       `json:"patientId"`
		PatientName   string    `json:"patientName"`
		Amount        float64   `json:"amount"`
		Status        string    `json:"status"`
		DueDate       string    `json:"dueDate"`
		IssuedDate    string    `json:"issuedDate"`
		PaymentMethod string    `json:"paymentMethod"`
		Notes         string    `json:"notes"`
		CreatedAt     time.Time `json:"createdAt"`
		UpdatedAt     time.Time `json:"updatedAt"`
	}{
		ID:            updatedInvoice.ID,
		PatientID:     updatedInvoice.PatientID,
		PatientName:   updatedInvoice.PatientName,
		Amount:        updatedInvoice.Amount,
		Status:        updatedInvoice.Status,
		DueDate:       updatedInvoice.DueDate,
		IssuedDate:    updatedInvoice.IssuedDate,
		PaymentMethod: updatedInvoice.PaymentMethod,
		Notes:         updatedInvoice.Notes,
		CreatedAt:     updatedInvoice.CreatedAt,
		UpdatedAt:     updatedInvoice.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteInvoice deletes an invoice by ID
func DeleteInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	id := c.Param("id")
	invoiceID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	// Delete invoice through service
	err = billingService.DeleteInvoice(invoiceID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
}

// GetInsuranceClaims retrieves all insurance claims with optional filtering
func GetInsuranceClaims(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	// Get query parameters for filtering
	status := c.Query("status")
	patientID := c.Query("patientId")

	// Get insurance claims from service
	var patientIDFilter string
	if patientID != "" {
		patientIDFilter = patientID
	}

	claims, err := billingService.GetAllInsuranceClaims(status, patientIDFilter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve insurance claims"})
		return
	}

	// Convert service models to handler response format
	response := make([]struct {
		ID             int       `json:"id"`
		PatientID      int       `json:"patientId"`
		TreatmentID    *int      `json:"treatmentId"` // nullable
		PatientName    string    `json:"patientName"`
		TreatmentName  *string   `json:"treatmentName"` // nullable
		ClaimAmount    float64   `json:"claimAmount"`
		Status         string    `json:"status"`
		SubmissionDate string    `json:"submissionDate"`
		ApprovalDate   *string   `json:"approvalDate"` // nullable
		Notes          string    `json:"notes"`
		CreatedAt      time.Time `json:"createdAt"`
		UpdatedAt      time.Time `json:"updatedAt"`
	}, len(claims))

	for i, claim := range claims {
		response[i] = struct {
			ID             int       `json:"id"`
			PatientID      int       `json:"patientId"`
			TreatmentID    *int      `json:"treatmentId"`
			PatientName    string    `json:"patientName"`
			TreatmentName  *string   `json:"treatmentName"`
			ClaimAmount    float64   `json:"claimAmount"`
			Status         string    `json:"status"`
			SubmissionDate string    `json:"submissionDate"`
			ApprovalDate   *string   `json:"approvalDate"`
			Notes          string    `json:"notes"`
			CreatedAt      time.Time `json:"createdAt"`
			UpdatedAt      time.Time `json:"updatedAt"`
		}{
			ID:             claim.ID,
			PatientID:      claim.PatientID,
			TreatmentID:    claim.TreatmentID,
			PatientName:    claim.PatientName,
			TreatmentName:  claim.TreatmentName,
			ClaimAmount:    claim.ClaimAmount,
			Status:         claim.Status,
			SubmissionDate: claim.SubmissionDate,
			ApprovalDate:   claim.ApprovalDate,
			Notes:          claim.Notes,
			CreatedAt:      claim.CreatedAt,
			UpdatedAt:      claim.UpdatedAt,
		}
	}

	c.JSON(http.StatusOK, response)
}

// GetInsuranceClaim retrieves a single insurance claim by ID
func GetInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	id := c.Param("id")
	claimID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid insurance claim ID"})
		return
	}

	// Get insurance claim from service
	claim, err := billingService.GetInsuranceClaimByID(claimID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve insurance claim"})
		return
	}

	if claim == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		ID             int       `json:"id"`
		PatientID      int       `json:"patientId"`
		TreatmentID    *int      `json:"treatmentId"` // nullable
		PatientName    string    `json:"patientName"`
		TreatmentName  *string   `json:"treatmentName"` // nullable
		ClaimAmount    float64   `json:"claimAmount"`
		Status         string    `json:"status"`
		SubmissionDate string    `json:"submissionDate"`
		ApprovalDate   *string   `json:"approvalDate"` // nullable
		Notes          string    `json:"notes"`
		CreatedAt      time.Time `json:"createdAt"`
		UpdatedAt      time.Time `json:"updatedAt"`
	}{
		ID:             claim.ID,
		PatientID:      claim.PatientID,
		TreatmentID:    claim.TreatmentID,
		PatientName:    claim.PatientName,
		TreatmentName:  claim.TreatmentName,
		ClaimAmount:    claim.ClaimAmount,
		Status:         claim.Status,
		SubmissionDate: claim.SubmissionDate,
		ApprovalDate:   claim.ApprovalDate,
		Notes:          claim.Notes,
		CreatedAt:      claim.CreatedAt,
		UpdatedAt:      claim.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// CreateInsuranceClaim creates a new insurance claim
func CreateInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	var req models.CreateInsuranceClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values if not provided
	if req.Status == "" {
		req.Status = "submitted"
	}

	if req.SubmissionDate == "" {
		req.SubmissionDate = time.Now().Format("2006-01-02")
	}

	// Create insurance claim through service
	newClaim, err := billingService.CreateInsuranceClaim(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create insurance claim"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		ID             int       `json:"id"`
		PatientID      int       `json:"patientId"`
		TreatmentID    *int      `json:"treatmentId"` // nullable
		PatientName    string    `json:"patientName"`
		TreatmentName  *string   `json:"treatmentName"` // nullable
		ClaimAmount    float64   `json:"claimAmount"`
		Status         string    `json:"status"`
		SubmissionDate string    `json:"submissionDate"`
		ApprovalDate   *string   `json:"approvalDate"` // nullable
		Notes          string    `json:"notes"`
		CreatedAt      time.Time `json:"createdAt"`
		UpdatedAt      time.Time `json:"updatedAt"`
	}{
		ID:             newClaim.ID,
		PatientID:      newClaim.PatientID,
		TreatmentID:    newClaim.TreatmentID,
		PatientName:    newClaim.PatientName,
		TreatmentName:  newClaim.TreatmentName,
		ClaimAmount:    newClaim.ClaimAmount,
		Status:         newClaim.Status,
		SubmissionDate: newClaim.SubmissionDate,
		ApprovalDate:   newClaim.ApprovalDate,
		Notes:          newClaim.Notes,
		CreatedAt:      newClaim.CreatedAt,
		UpdatedAt:      newClaim.UpdatedAt,
	}

	c.JSON(http.StatusCreated, response)
}

// UpdateInsuranceClaim updates an existing insurance claim
func UpdateInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	id := c.Param("id")
	claimID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid insurance claim ID"})
		return
	}

	var req models.UpdateInsuranceClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update insurance claim through service
	updatedClaim, err := billingService.UpdateInsuranceClaim(claimID, req)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update insurance claim"})
		return
	}

	// Convert service model to handler response format
	response := struct {
		ID             int       `json:"id"`
		PatientID      int       `json:"patientId"`
		TreatmentID    *int      `json:"treatmentId"` // nullable
		PatientName    string    `json:"patientName"`
		TreatmentName  *string   `json:"treatmentName"` // nullable
		ClaimAmount    float64   `json:"claimAmount"`
		Status         string    `json:"status"`
		SubmissionDate string    `json:"submissionDate"`
		ApprovalDate   *string   `json:"approvalDate"` // nullable
		Notes          string    `json:"notes"`
		CreatedAt      time.Time `json:"createdAt"`
		UpdatedAt      time.Time `json:"updatedAt"`
	}{
		ID:             updatedClaim.ID,
		PatientID:      updatedClaim.PatientID,
		TreatmentID:    updatedClaim.TreatmentID,
		PatientName:    updatedClaim.PatientName,
		TreatmentName:  updatedClaim.TreatmentName,
		ClaimAmount:    updatedClaim.ClaimAmount,
		Status:         updatedClaim.Status,
		SubmissionDate: updatedClaim.SubmissionDate,
		ApprovalDate:   updatedClaim.ApprovalDate,
		Notes:          updatedClaim.Notes,
		CreatedAt:      updatedClaim.CreatedAt,
		UpdatedAt:      updatedClaim.UpdatedAt,
	}

	c.JSON(http.StatusOK, response)
}

// DeleteInsuranceClaim deletes an insurance claim by ID
func DeleteInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Create billing service
	billingService := services.NewBillingService(db)

	id := c.Param("id")
	claimID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid insurance claim ID"})
		return
	}

	// Delete insurance claim through service
	err = billingService.DeleteInsuranceClaim(claimID)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete insurance claim"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Insurance claim deleted successfully"})
}
