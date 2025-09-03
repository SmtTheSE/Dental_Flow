// dental_backend/internal/services/billing_service.go
package services

import (
	"database/sql"
	"dental_backend/internal/models"
	"strconv"
)

// BillingService provides business logic for billing and insurance operations
type BillingService struct {
	db *sql.DB
}

// NewBillingService creates a new billing service
func NewBillingService(db *sql.DB) *BillingService {
	return &BillingService{db: db}
}

// GetBillingStats retrieves billing statistics for the dashboard
func (s *BillingService) GetBillingStats() (*models.BillingStats, error) {
	var stats models.BillingStats

	// Get monthly revenue (paid invoices this month)
	err := s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM invoices 
		WHERE status = 'paid' 
		AND EXTRACT(YEAR FROM issued_date) = EXTRACT(YEAR FROM CURRENT_DATE)
		AND EXTRACT(MONTH FROM issued_date) = EXTRACT(MONTH FROM CURRENT_DATE)`).Scan(&stats.MonthlyRevenue)

	if err != nil {
		return nil, err
	}

	// Get pending payments (pending invoices)
	err = s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM invoices 
		WHERE status = 'pending'`).Scan(&stats.PendingPayments)

	if err != nil {
		return nil, err
	}

	// Get insurance claims amount (submitted claims)
	err = s.db.QueryRow(`
		SELECT COALESCE(SUM(claim_amount), 0) 
		FROM insurance_claims 
		WHERE status = 'submitted'`).Scan(&stats.InsuranceClaims)

	if err != nil {
		return nil, err
	}

	// Get collections (paid invoices)
	err = s.db.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM invoices 
		WHERE status = 'paid'`).Scan(&stats.Collections)

	if err != nil {
		return nil, err
	}

	return &stats, nil
}

// GetAllInvoices retrieves all invoices with optional filtering
func (s *BillingService) GetAllInvoices(status, patientID string) ([]models.Invoice, error) {
	query := `
		SELECT i.id, i.patient_id, COALESCE(p.first_name || ' ' || p.last_name, 'Unknown Patient') as patient_name, 
		       i.amount, i.status, i.due_date, i.issued_date, i.payment_method, i.notes, i.created_at, i.updated_at
		FROM invoices i
		LEFT JOIN patients p ON i.patient_id = p.id
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

	if status != "" {
		query += " AND i.status = $" + strconv.Itoa(argCount)
		args = append(args, status)
		argCount++
	}

	if patientID != "" {
		query += " AND i.patient_id = $" + strconv.Itoa(argCount)
		args = append(args, patientID)
		argCount++
	}

	query += " ORDER BY i.created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var i models.Invoice
		err := rows.Scan(
			&i.ID, &i.PatientID, &i.PatientName, &i.Amount, &i.Status,
			&i.DueDate, &i.IssuedDate, &i.PaymentMethod, &i.Notes,
			&i.CreatedAt, &i.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		invoices = append(invoices, i)
	}

	// Check for errors that occurred during iteration
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return invoices, nil
}

// / GetInvoiceByID retrieves a single invoice by ID
func (s *BillingService) GetInvoiceByID(id int) (*models.Invoice, error) {
	var i models.Invoice
	err := s.db.QueryRow(`
		SELECT i.id, i.patient_id, COALESCE(p.first_name || ' ' || p.last_name, 'Unknown Patient') as patient_name, 
		       i.amount, i.status, i.due_date, i.issued_date, i.payment_method, i.notes, i.created_at, i.updated_at
		FROM invoices i
		LEFT JOIN patients p ON i.patient_id = p.id
		WHERE i.id = $1`, id).Scan(
		&i.ID, &i.PatientID, &i.PatientName, &i.Amount, &i.Status,
		&i.DueDate, &i.IssuedDate, &i.PaymentMethod, &i.Notes,
		&i.CreatedAt, &i.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &i, nil
}

// CreateInvoice creates a new invoice
func (s *BillingService) CreateInvoice(req models.CreateInvoiceRequest) (*models.Invoice, error) {
	// Set default values if not provided
	if req.Status == "" {
		req.Status = "pending"
	}

	var newInvoice models.Invoice
	err := s.db.QueryRow(`
		INSERT INTO invoices (
			patient_id, amount, status, due_date, issued_date, payment_method, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, NOW(), NOW())
		RETURNING id, patient_id, (SELECT COALESCE(first_name || ' ' || last_name, 'Unknown Patient') FROM patients WHERE id = $1), 
		          amount, status, due_date, issued_date, payment_method, notes, created_at, updated_at`,
		req.PatientID, req.Amount, req.Status, req.DueDate, nullIfEmpty(req.IssuedDate), req.PaymentMethod, req.Notes,
	).Scan(
		&newInvoice.ID, &newInvoice.PatientID, &newInvoice.PatientName,
		&newInvoice.Amount, &newInvoice.Status, &newInvoice.DueDate,
		&newInvoice.IssuedDate, &newInvoice.PaymentMethod, &newInvoice.Notes,
		&newInvoice.CreatedAt, &newInvoice.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &newInvoice, nil
}

// UpdateInvoice updates an existing invoice
func (s *BillingService) UpdateInvoice(id int, req models.UpdateInvoiceRequest) (*models.Invoice, error) {
	// Build the update query dynamically based on provided fields
	query := "UPDATE invoices SET updated_at = NOW()"
	args := []interface{}{id}
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

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	// Retrieve the updated invoice
	var updatedInvoice models.Invoice
	err = s.db.QueryRow(`
		SELECT i.id, i.patient_id, COALESCE(p.first_name || ' ' || p.last_name, 'Unknown Patient') as patient_name, 
		       i.amount, i.status, i.due_date, i.issued_date, i.payment_method, i.notes, i.created_at, i.updated_at
		FROM invoices i
		LEFT JOIN patients p ON i.patient_id = p.id
		WHERE i.id = $1`, id).Scan(
		&updatedInvoice.ID, &updatedInvoice.PatientID, &updatedInvoice.PatientName,
		&updatedInvoice.Amount, &updatedInvoice.Status, &updatedInvoice.DueDate,
		&updatedInvoice.IssuedDate, &updatedInvoice.PaymentMethod, &updatedInvoice.Notes,
		&updatedInvoice.CreatedAt, &updatedInvoice.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &updatedInvoice, nil
}

// DeleteInvoice deletes an invoice by ID
func (s *BillingService) DeleteInvoice(id int) error {
	result, err := s.db.Exec("DELETE FROM invoices WHERE id = $1", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// GetAllInsuranceClaims retrieves all insurance claims with optional filtering
func (s *BillingService) GetAllInsuranceClaims(status, patientID string) ([]models.InsuranceClaim, error) {
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
		query += " AND ic.patient_id = $" + strconv.Itoa(argCount)
		args = append(args, patientID)
		argCount++
	}

	query += " ORDER BY ic.created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var claims []models.InsuranceClaim
	for rows.Next() {
		var ic models.InsuranceClaim
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
			return nil, err
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

	return claims, rows.Err()
}

// GetInsuranceClaimByID retrieves a single insurance claim by ID
func (s *BillingService) GetInsuranceClaimByID(id int) (*models.InsuranceClaim, error) {
	var ic models.InsuranceClaim
	var treatmentID sql.NullInt64
	var treatmentName sql.NullString
	var approvalDate sql.NullString

	err := s.db.QueryRow(`
		SELECT ic.id, ic.patient_id, p.name as patient_name, ic.treatment_id, 
		       t.name as treatment_name, ic.claim_amount, ic.status, 
		       ic.submission_date, ic.approval_date, ic.notes, ic.created_at, ic.updated_at
		FROM insurance_claims ic
		JOIN patients p ON ic.patient_id = p.id
		LEFT JOIN treatments t ON ic.treatment_id = t.id
		WHERE ic.id = $1`, id).Scan(
		&ic.ID, &ic.PatientID, &ic.PatientName, &treatmentID,
		&treatmentName, &ic.ClaimAmount, &ic.Status,
		&ic.SubmissionDate, &approvalDate, &ic.Notes,
		&ic.CreatedAt, &ic.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
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

	return &ic, nil
}

// CreateInsuranceClaim creates a new insurance claim
func (s *BillingService) CreateInsuranceClaim(req models.CreateInsuranceClaimRequest) (*models.InsuranceClaim, error) {
	// Set default values if not provided
	if req.Status == "" {
		req.Status = "submitted"
	}

	var newClaim models.InsuranceClaim
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

	err := s.db.QueryRow(`
		INSERT INTO insurance_claims (
			patient_id, treatment_id, claim_amount, status, submission_date, approval_date, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6, $7, NOW(), NOW())
		RETURNING id, patient_id, (SELECT name FROM patients WHERE id = $1), 
		          treatment_id, (SELECT name FROM treatments WHERE id = $2), 
		          claim_amount, status, submission_date, approval_date, notes, created_at, updated_at`,
		req.PatientID, treatmentID, req.ClaimAmount, req.Status, nullIfEmpty(req.SubmissionDate), approvalDate, req.Notes,
	).Scan(
		&newClaim.ID, &newClaim.PatientID, &newClaim.PatientName,
		&treatmentID, &newClaim.TreatmentName,
		&newClaim.ClaimAmount, &newClaim.Status, &newClaim.SubmissionDate,
		&approvalDate, &newClaim.Notes, &newClaim.CreatedAt, &newClaim.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Handle nullable fields
	if treatmentID.Valid {
		treatmentIDValue := int(treatmentID.Int64)
		newClaim.TreatmentID = &treatmentIDValue
	}

	if approvalDate.Valid {
		newClaim.ApprovalDate = &approvalDate.String
	}

	return &newClaim, nil
}

// UpdateInsuranceClaim updates an existing insurance claim
func (s *BillingService) UpdateInsuranceClaim(id int, req models.UpdateInsuranceClaimRequest) (*models.InsuranceClaim, error) {
	// Build the update query dynamically based on provided fields
	query := "UPDATE insurance_claims SET updated_at = NOW()"
	args := []interface{}{id}
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
	} else {
		query += ", treatment_id = NULL"
		argCount++
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
	} else {
		query += ", approval_date = NULL"
		argCount++
	}

	if req.Notes != "" {
		query += ", notes = $" + strconv.Itoa(argCount)
		args = append(args, req.Notes)
		argCount++
	}

	query += " WHERE id = $1"

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, err
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	// Retrieve the updated insurance claim
	var updatedClaim models.InsuranceClaim
	var treatmentID sql.NullInt64
	var treatmentName sql.NullString
	var approvalDate sql.NullString

	err = s.db.QueryRow(`
		SELECT ic.id, ic.patient_id, p.name as patient_name, ic.treatment_id, 
		       t.name as treatment_name, ic.claim_amount, ic.status, 
		       ic.submission_date, ic.approval_date, ic.notes, ic.created_at, ic.updated_at
		FROM insurance_claims ic
		JOIN patients p ON ic.patient_id = p.id
		LEFT JOIN treatments t ON ic.treatment_id = t.id
		WHERE ic.id = $1`, id).Scan(
		&updatedClaim.ID, &updatedClaim.PatientID, &updatedClaim.PatientName,
		&treatmentID, &updatedClaim.TreatmentName,
		&updatedClaim.ClaimAmount, &updatedClaim.Status, &updatedClaim.SubmissionDate,
		&approvalDate, &updatedClaim.Notes, &updatedClaim.CreatedAt, &updatedClaim.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
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

	return &updatedClaim, nil
}

// DeleteInsuranceClaim deletes an insurance claim by ID
func (s *BillingService) DeleteInsuranceClaim(id int) error {
	result, err := s.db.Exec("DELETE FROM insurance_claims WHERE id = $1", id)
	if err != nil {
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// Helper function to return NULL for empty strings
func nullIfEmpty(s string) interface{} {
	if s == "" {
		return nil
	}
	return s
}
