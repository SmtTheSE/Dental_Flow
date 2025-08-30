// dental_backend/internal/handlers/billing.go
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"dental_backend/internal/database"

	"github.com/gin-gonic/gin"
)

// Invoice represents an invoice in the system
type Invoice struct {
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
}

// InsuranceClaim represents an insurance claim in the system
type InsuranceClaim struct {
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
}

// CreateInvoiceRequest represents the request payload for creating an invoice
type CreateInvoiceRequest struct {
	PatientID     int     `json:"patientId" binding:"required"`
	Amount        float64 `json:"amount" binding:"required,min=0"`
	Status        string  `json:"status" binding:"oneof=pending paid overdue"`
	DueDate       string  `json:"dueDate" binding:"required"`
	IssuedDate    string  `json:"issuedDate"`
	PaymentMethod string  `json:"paymentMethod"`
	Notes         string  `json:"notes"`
}

// UpdateInvoiceRequest represents the request payload for updating an invoice
type UpdateInvoiceRequest struct {
	PatientID     int     `json:"patientId"`
	Amount        float64 `json:"amount" binding:"min=0"`
	Status        string  `json:"status" binding:"oneof=pending paid overdue"`
	DueDate       string  `json:"dueDate"`
	IssuedDate    string  `json:"issuedDate"`
	PaymentMethod string  `json:"paymentMethod"`
	Notes         string  `json:"notes"`
}

// CreateInsuranceClaimRequest represents the request payload for creating an insurance claim
type CreateInsuranceClaimRequest struct {
	PatientID      int     `json:"patientId" binding:"required"`
	TreatmentID    *int    `json:"treatmentId"`
	ClaimAmount    float64 `json:"claimAmount" binding:"required,min=0"`
	Status         string  `json:"status" binding:"oneof=submitted approved denied"`
	SubmissionDate string  `json:"submissionDate"`
	ApprovalDate   *string `json:"approvalDate"`
	Notes          string  `json:"notes"`
}

// UpdateInsuranceClaimRequest represents the request payload for updating an insurance claim
type UpdateInsuranceClaimRequest struct {
	PatientID      int     `json:"patientId"`
	TreatmentID    *int    `json:"treatmentId"`
	ClaimAmount    float64 `json:"claimAmount" binding:"min=0"`
	Status         string  `json:"status" binding:"oneof=submitted approved denied"`
	SubmissionDate string  `json:"submissionDate"`
	ApprovalDate   *string `json:"approvalDate"`
	Notes          string  `json:"notes"`
}

// BillingStats represents billing statistics for the dashboard
type BillingStats struct {
	MonthlyRevenue  float64 `json:"monthlyRevenue"`
	PendingPayments float64 `json:"pendingPayments"`
	InsuranceClaims float64 `json:"insuranceClaims"`
	Collections     float64 `json:"collections"`
}

// GetBillingStats retrieves billing statistics for the dashboard
func GetBillingStats(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	var stats BillingStats

	// Get monthly revenue (paid invoices this month)
	err := db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM invoices 
		WHERE status = 'paid' 
		AND EXTRACT(YEAR FROM issued_date) = EXTRACT(YEAR FROM CURRENT_DATE)
		AND EXTRACT(MONTH FROM issued_date) = EXTRACT(MONTH FROM CURRENT_DATE)`).Scan(&stats.MonthlyRevenue)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve monthly revenue"})
		return
	}

	// Get pending payments (pending invoices)
	err = db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM invoices 
		WHERE status = 'pending'`).Scan(&stats.PendingPayments)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve pending payments"})
		return
	}

	// Get insurance claims amount (submitted claims)
	err = db.QueryRow(`
		SELECT COALESCE(SUM(claim_amount), 0) 
		FROM insurance_claims 
		WHERE status = 'submitted'`).Scan(&stats.InsuranceClaims)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve insurance claims"})
		return
	}

	// Get collections (paid invoices)
	err = db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM invoices 
		WHERE status = 'paid'`).Scan(&stats.Collections)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve collections"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetInvoices retrieves all invoices with optional filtering
func GetInvoices(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Get query parameters for filtering
	status := c.Query("status")
	patientID := c.Query("patientId")

	// Build query with filters
	query := `
		SELECT i.id, i.patient_id, p.name as patient_name, i.amount, i.status, 
		       i.due_date, i.issued_date, i.payment_method, i.notes, i.created_at, i.updated_at
		FROM invoices i
		JOIN patients p ON i.patient_id = p.id
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += " AND i.status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}

	if patientID != "" {
		pid, err := strconv.Atoi(patientID)
		if err == nil {
			query += " AND i.patient_id = $" + strconv.Itoa(argCount)
			args = append(args, pid)
			argCount++
		}
	}

	query += " ORDER BY i.created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoices"})
		return
	}
	defer rows.Close()

	var invoices []Invoice
	for rows.Next() {
		var i Invoice
		err := rows.Scan(
			&i.ID, &i.PatientID, &i.PatientName, &i.Amount, &i.Status,
			&i.DueDate, &i.IssuedDate, &i.PaymentMethod, &i.Notes,
			&i.CreatedAt, &i.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan invoice data"})
			return
		}
		invoices = append(invoices, i)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating invoices"})
		return
	}

	c.JSON(http.StatusOK, invoices)
}

// GetInvoice retrieves a single invoice by ID
func GetInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	invoiceID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var i Invoice
	err = db.QueryRow(`
		SELECT i.id, i.patient_id, p.name as patient_name, i.amount, i.status, 
		       i.due_date, i.issued_date, i.payment_method, i.notes, i.created_at, i.updated_at
		FROM invoices i
		JOIN patients p ON i.patient_id = p.id
		WHERE i.id = $1`, invoiceID).Scan(
		&i.ID, &i.PatientID, &i.PatientName, &i.Amount, &i.Status,
		&i.DueDate, &i.IssuedDate, &i.PaymentMethod, &i.Notes,
		&i.CreatedAt, &i.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve invoice"})
		return
	}

	c.JSON(http.StatusOK, i)
}

// CreateInvoice creates a new invoice
func CreateInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	var req CreateInvoiceRequest
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

	var newInvoice Invoice
	err := db.QueryRow(`
		INSERT INTO invoices (
			patient_id, amount, status, due_date, issued_date, payment_method, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, patient_id, (SELECT name FROM patients WHERE id = $1), 
		          amount, status, due_date, issued_date, payment_method, notes, created_at, updated_at`,
		req.PatientID, req.Amount, req.Status, req.DueDate, req.IssuedDate, req.PaymentMethod, req.Notes,
	).Scan(
		&newInvoice.ID, &newInvoice.PatientID, &newInvoice.PatientName,
		&newInvoice.Amount, &newInvoice.Status, &newInvoice.DueDate,
		&newInvoice.IssuedDate, &newInvoice.PaymentMethod, &newInvoice.Notes,
		&newInvoice.CreatedAt, &newInvoice.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create invoice"})
		return
	}

	c.JSON(http.StatusCreated, newInvoice)
}

// UpdateInvoice updates an existing invoice
func UpdateInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	invoiceID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	var req UpdateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build the update query dynamically based on provided fields
	query := "UPDATE invoices SET updated_at = NOW()"
	args := []interface{}{invoiceID}
	argCount := 2

	if req.PatientID != 0 {
		query += ", patient_id = $" + strconv.Itoa(argCount)
		args = append(args, req.PatientID)
		argCount++
	}

	if req.Amount != 0 {
		query += ", amount = $" + strconv.Itoa(argCount)
		args = append(args, req.Amount)
		argCount++
	}

	if req.Status != "" {
		query += ", status = $" + strconv.Itoa(argCount)
		args = append(args, req.Status)
		argCount++
	}

	if req.DueDate != "" {
		query += ", due_date = $" + strconv.Itoa(argCount)
		args = append(args, req.DueDate)
		argCount++
	}

	if req.IssuedDate != "" {
		query += ", issued_date = $" + strconv.Itoa(argCount)
		args = append(args, req.IssuedDate)
		argCount++
	}

	if req.PaymentMethod != "" {
		query += ", payment_method = $" + strconv.Itoa(argCount)
		args = append(args, req.PaymentMethod)
		argCount++
	}

	if req.Notes != "" {
		query += ", notes = $" + strconv.Itoa(argCount)
		args = append(args, req.Notes)
		argCount++
	}

	query += " WHERE id = $1"

	result, err := db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invoice"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	// Retrieve the updated invoice
	var updatedInvoice Invoice
	err = db.QueryRow(`
		SELECT i.id, i.patient_id, p.name as patient_name, i.amount, i.status, 
		       i.due_date, i.issued_date, i.payment_method, i.notes, i.created_at, i.updated_at
		FROM invoices i
		JOIN patients p ON i.patient_id = p.id
		WHERE i.id = $1`, invoiceID).Scan(
		&updatedInvoice.ID, &updatedInvoice.PatientID, &updatedInvoice.PatientName,
		&updatedInvoice.Amount, &updatedInvoice.Status, &updatedInvoice.DueDate,
		&updatedInvoice.IssuedDate, &updatedInvoice.PaymentMethod, &updatedInvoice.Notes,
		&updatedInvoice.CreatedAt, &updatedInvoice.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated invoice"})
		return
	}

	c.JSON(http.StatusOK, updatedInvoice)
}

// DeleteInvoice deletes an invoice by ID
func DeleteInvoice(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	invoiceID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoice ID"})
		return
	}

	result, err := db.Exec("DELETE FROM invoices WHERE id = $1", invoiceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice deleted successfully"})
}

// GetInsuranceClaims retrieves all insurance claims with optional filtering
func GetInsuranceClaims(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	// Get query parameters for filtering
	status := c.Query("status")
	patientID := c.Query("patientId")

	// Build query with filters
	query := `
		SELECT ic.id, ic.patient_id, p.name as patient_name, ic.treatment_id, 
		       t.name as treatment_name, ic.claim_amount, ic.status, 
		       ic.submission_date, ic.approval_date, ic.notes, ic.created_at, ic.updated_at
		FROM insurance_claims ic
		JOIN patients p ON ic.patient_id = p.id
		LEFT JOIN treatments t ON ic.treatment_id = t.id
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += " AND ic.status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}

	if patientID != "" {
		pid, err := strconv.Atoi(patientID)
		if err == nil {
			query += " AND ic.patient_id = $" + strconv.Itoa(argCount)
			args = append(args, pid)
			argCount++
		}
	}

	query += " ORDER BY ic.created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve insurance claims"})
		return
	}
	defer rows.Close()

	var claims []InsuranceClaim
	for rows.Next() {
		var ic InsuranceClaim
		var treatmentID sql.NullInt64
		var treatmentName sql.NullString
		var approvalDate sql.NullString

		err := rows.Scan(
			&ic.ID, &ic.PatientID, &ic.PatientName, &treatmentID,
			&treatmentName, &ic.ClaimAmount, &ic.Status,
			&ic.SubmissionDate, &approvalDate, &ic.Notes,
			&ic.CreatedAt, &ic.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan insurance claim data"})
			return
		}

		// Handle nullable fields
		if treatmentID.Valid {
			treatmentIDValue := int(treatmentID.Int64)
			ic.TreatmentID = &treatmentIDValue
		}

		if treatmentName.Valid {
			ic.TreatmentName = &treatmentName.String
		}

		if approvalDate.Valid {
			ic.ApprovalDate = &approvalDate.String
		}

		claims = append(claims, ic)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating insurance claims"})
		return
	}

	c.JSON(http.StatusOK, claims)
}

// GetInsuranceClaim retrieves a single insurance claim by ID
func GetInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	claimID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid insurance claim ID"})
		return
	}

	var ic InsuranceClaim
	var treatmentID sql.NullInt64
	var treatmentName sql.NullString
	var approvalDate sql.NullString

	err = db.QueryRow(`
		SELECT ic.id, ic.patient_id, p.name as patient_name, ic.treatment_id, 
		       t.name as treatment_name, ic.claim_amount, ic.status, 
		       ic.submission_date, ic.approval_date, ic.notes, ic.created_at, ic.updated_at
		FROM insurance_claims ic
		JOIN patients p ON ic.patient_id = p.id
		LEFT JOIN treatments t ON ic.treatment_id = t.id
		WHERE ic.id = $1`, claimID).Scan(
		&ic.ID, &ic.PatientID, &ic.PatientName, &treatmentID,
		&treatmentName, &ic.ClaimAmount, &ic.Status,
		&ic.SubmissionDate, &approvalDate, &ic.Notes,
		&ic.CreatedAt, &ic.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve insurance claim"})
		return
	}

	// Handle nullable fields
	if treatmentID.Valid {
		treatmentIDValue := int(treatmentID.Int64)
		ic.TreatmentID = &treatmentIDValue
	}

	if treatmentName.Valid {
		ic.TreatmentName = &treatmentName.String
	}

	if approvalDate.Valid {
		ic.ApprovalDate = &approvalDate.String
	}

	c.JSON(http.StatusOK, ic)
}

// CreateInsuranceClaim creates a new insurance claim
func CreateInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	var req CreateInsuranceClaimRequest
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

	var newClaim InsuranceClaim
	var treatmentID sql.NullInt64
	var approvalDate sql.NullString

	if req.TreatmentID != nil {
		treatmentID.Valid = true
		treatmentID.Int64 = int64(*req.TreatmentID)
	}

	if req.ApprovalDate != nil {
		approvalDate.Valid = true
		approvalDate.String = *req.ApprovalDate
	}

	err := db.QueryRow(`
		INSERT INTO insurance_claims (
			patient_id, treatment_id, claim_amount, status, submission_date, approval_date, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, patient_id, (SELECT name FROM patients WHERE id = $1), 
		          treatment_id, (SELECT name FROM treatments WHERE id = $2), 
		          claim_amount, status, submission_date, approval_date, notes, created_at, updated_at`,
		req.PatientID, treatmentID, req.ClaimAmount, req.Status, req.SubmissionDate, approvalDate, req.Notes,
	).Scan(
		&newClaim.ID, &newClaim.PatientID, &newClaim.PatientName,
		&treatmentID, &newClaim.TreatmentName,
		&newClaim.ClaimAmount, &newClaim.Status, &newClaim.SubmissionDate,
		&approvalDate, &newClaim.Notes, &newClaim.CreatedAt, &newClaim.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create insurance claim"})
		return
	}

	// Handle nullable fields
	if treatmentID.Valid {
		treatmentIDValue := int(treatmentID.Int64)
		newClaim.TreatmentID = &treatmentIDValue
	}

	if approvalDate.Valid {
		newClaim.ApprovalDate = &approvalDate.String
	}

	c.JSON(http.StatusCreated, newClaim)
}

// UpdateInsuranceClaim updates an existing insurance claim
func UpdateInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	claimID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid insurance claim ID"})
		return
	}

	var req UpdateInsuranceClaimRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build the update query dynamically based on provided fields
	query := "UPDATE insurance_claims SET updated_at = NOW()"
	args := []interface{}{claimID}
	argCount := 2

	if req.PatientID != 0 {
		query += ", patient_id = $" + strconv.Itoa(argCount)
		args = append(args, req.PatientID)
		argCount++
	}

	if req.TreatmentID != nil {
		if *req.TreatmentID == 0 {
			query += ", treatment_id = NULL"
		} else {
			query += ", treatment_id = $" + strconv.Itoa(argCount)
			args = append(args, *req.TreatmentID)
			argCount++
		}
	}

	if req.ClaimAmount != 0 {
		query += ", claim_amount = $" + strconv.Itoa(argCount)
		args = append(args, req.ClaimAmount)
		argCount++
	}

	if req.Status != "" {
		query += ", status = $" + strconv.Itoa(argCount)
		args = append(args, req.Status)
		argCount++
	}

	if req.SubmissionDate != "" {
		query += ", submission_date = $" + strconv.Itoa(argCount)
		args = append(args, req.SubmissionDate)
		argCount++
	}

	if req.ApprovalDate != nil {
		if *req.ApprovalDate == "" {
			query += ", approval_date = NULL"
		} else {
			query += ", approval_date = $" + strconv.Itoa(argCount)
			args = append(args, *req.ApprovalDate)
			argCount++
		}
	}

	if req.Notes != "" {
		query += ", notes = $" + strconv.Itoa(argCount)
		args = append(args, req.Notes)
		argCount++
	}

	query += " WHERE id = $1"

	result, err := db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update insurance claim"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
		return
	}

	// Retrieve the updated insurance claim
	var updatedClaim InsuranceClaim
	var treatmentID sql.NullInt64
	var treatmentName sql.NullString
	var approvalDate sql.NullString

	err = db.QueryRow(`
		SELECT ic.id, ic.patient_id, p.name as patient_name, ic.treatment_id, 
		       t.name as treatment_name, ic.claim_amount, ic.status, 
		       ic.submission_date, ic.approval_date, ic.notes, ic.created_at, ic.updated_at
		FROM insurance_claims ic
		JOIN patients p ON ic.patient_id = p.id
		LEFT JOIN treatments t ON ic.treatment_id = t.id
		WHERE ic.id = $1`, claimID).Scan(
		&updatedClaim.ID, &updatedClaim.PatientID, &updatedClaim.PatientName,
		&treatmentID, &updatedClaim.TreatmentName,
		&updatedClaim.ClaimAmount, &updatedClaim.Status, &updatedClaim.SubmissionDate,
		&approvalDate, &updatedClaim.Notes, &updatedClaim.CreatedAt, &updatedClaim.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated insurance claim"})
		return
	}

	// Handle nullable fields
	if treatmentID.Valid {
		treatmentIDValue := int(treatmentID.Int64)
		updatedClaim.TreatmentID = &treatmentIDValue
	}

	if treatmentName.Valid {
		updatedClaim.TreatmentName = &treatmentName.String
	}

	if approvalDate.Valid {
		updatedClaim.ApprovalDate = &approvalDate.String
	}

	c.JSON(http.StatusOK, updatedClaim)
}

// DeleteInsuranceClaim deletes an insurance claim by ID
func DeleteInsuranceClaim(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	claimID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid insurance claim ID"})
		return
	}

	result, err := db.Exec("DELETE FROM insurance_claims WHERE id = $1", claimID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete insurance claim"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Insurance claim not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Insurance claim deleted successfully"})
}
