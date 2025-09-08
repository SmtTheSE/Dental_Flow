// dental_backend/internal/services/treatment_service.go
package services

import (
	"database/sql"
	"dental_backend/internal/models"
	"fmt"
	"log"
	"strconv"
	"time"
)

// TreatmentService provides business logic for treatment operations
type TreatmentService struct {
	db *sql.DB
}

// NewTreatmentService creates a new treatment service
func NewTreatmentService(db *sql.DB) *TreatmentService {
	return &TreatmentService{db: db}
}

// GetAllTreatments retrieves all treatments
func (s *TreatmentService) GetAllTreatments() ([]models.Treatment, error) {
	log.Println("Fetching all treatments...")

	// Use $1, $2... for PostgreSQL placeholder syntax
	rows, err := s.db.Query(`
		SELECT id, name, description, cost, duration_minutes, category
		FROM treatments
		ORDER BY name ASC`)

	if err != nil {
		log.Printf("Error querying treatments: %v", err)
		return nil, fmt.Errorf("failed to query treatments: %w", err)
	}
	defer rows.Close()

	var treatments []models.Treatment
	for rows.Next() {
		var t models.Treatment
		err := rows.Scan(
			&t.ID, &t.Name, &t.Description, &t.Cost, &t.Duration, &t.Category,
		)
		if err != nil {
			log.Printf("Error scanning treatment row: %v", err)
			return nil, fmt.Errorf("failed to scan treatment: %w", err)
		}
		treatments = append(treatments, t)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Error iterating treatment rows: %v", err)
		return nil, fmt.Errorf("error iterating treatments: %w", err)
	}

	log.Printf("Successfully fetched %d treatments", len(treatments))
	return treatments, nil
}

// GetTreatmentByID retrieves a single treatment by ID
func (s *TreatmentService) GetTreatmentByID(id int) (*models.Treatment, error) {
	var t models.Treatment
	err := s.db.QueryRow(`
		SELECT id, name, description, cost, duration_minutes, category
		FROM treatments
		WHERE id = $1`, id).Scan(
		&t.ID, &t.Name, &t.Description, &t.Cost, &t.Duration, &t.Category,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get treatment by ID %d: %w", id, err)
	}

	return &t, nil
}

// CreateTreatment creates a new treatment
func (s *TreatmentService) CreateTreatment(req models.CreateTreatmentRequest) (*models.Treatment, error) {
	// Set default category if not provided
	if req.Category == "" {
		req.Category = string(models.TreatmentCategoryGeneral)
	}

	// For PostgreSQL, use RETURNING to get the inserted ID
	var id int
	err := s.db.QueryRow(`
		INSERT INTO treatments (
			name, description, cost, duration_minutes, category
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id`,
		req.Name, req.Description, req.Cost, req.Duration, req.Category,
	).Scan(&id)

	if err != nil {
		return nil, fmt.Errorf("failed to insert treatment: %w", err)
	}

	// Fetch the created treatment
	return s.GetTreatmentByID(id)
}

// UpdateTreatment updates an existing treatment
func (s *TreatmentService) UpdateTreatment(id int, req models.UpdateTreatmentRequest) (*models.Treatment, error) {
	// Build the update query dynamically based on provided fields
	setParts := []string{} // Removed updated_at since it doesn't exist in the table
	args := []interface{}{}

	argIndex := 1

	if req.Name != "" {
		setParts = append(setParts, "name = $"+strconv.Itoa(argIndex))
		args = append(args, req.Name)
		argIndex++
	}

	if req.Description != "" {
		setParts = append(setParts, "description = $"+strconv.Itoa(argIndex))
		args = append(args, req.Description)
		argIndex++
	}

	if req.Cost != 0 {
		setParts = append(setParts, "cost = $"+strconv.Itoa(argIndex))
		args = append(args, req.Cost)
		argIndex++
	}

	if req.Duration != 0 {
		setParts = append(setParts, "duration_minutes = $"+strconv.Itoa(argIndex))
		args = append(args, req.Duration)
		argIndex++
	}

	if req.Category != "" {
		setParts = append(setParts, "category = $"+strconv.Itoa(argIndex))
		args = append(args, req.Category)
		argIndex++
	}

	// If no fields to update, return the existing treatment
	if len(setParts) == 0 {
		return s.GetTreatmentByID(id)
	}

	// Add the WHERE clause parameter
	args = append(args, id)

	query := fmt.Sprintf("UPDATE treatments SET %s WHERE id = $%d",
		joinStrings(setParts, ", "), argIndex)

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update treatment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	// Retrieve the updated treatment
	return s.GetTreatmentByID(id)
}

// DeleteTreatment deletes a treatment by ID
func (s *TreatmentService) DeleteTreatment(id int) error {
	result, err := s.db.Exec("DELETE FROM treatments WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete treatment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// GetTreatmentQueue retrieves all patient treatments with status "pending" or "in-progress"
func (s *TreatmentService) GetTreatmentQueue() ([]models.PatientTreatment, error) {
	rows, err := s.db.Query(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.first_name || ' ' || p.last_name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.status IN ('pending', 'in-progress')
		ORDER BY pt.priority DESC, pt.created_at ASC`)

	if err != nil {
		return nil, fmt.Errorf("failed to query treatment queue: %w", err)
	}
	defer rows.Close()

	var treatments []models.PatientTreatment
	for rows.Next() {
		var pt models.PatientTreatment
		var dentistIDNull sql.NullInt64
		var completionDate sql.NullString
		var dentistName sql.NullString

		err := rows.Scan(
			&pt.ID, &pt.PatientID, &pt.TreatmentID, &dentistIDNull, &pt.PatientName,
			&pt.TreatmentName, &dentistName, &pt.Status, &pt.Priority,
			&pt.StartDate, &completionDate, &pt.Notes, &pt.CreatedAt, &pt.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan patient treatment: %w", err)
		}

		// Handle nullable fields
		if dentistIDNull.Valid {
			dentistIDValue := int(dentistIDNull.Int64)
			pt.DentistID = &dentistIDValue
		}

		if dentistName.Valid {
			pt.DentistName = &dentistName.String
		}

		if completionDate.Valid {
			pt.CompletionDate = &completionDate.String
		}

		treatments = append(treatments, pt)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating treatment queue: %w", err)
	}

	return treatments, nil
}

// GetTreatmentQueueForDentist retrieves all patient treatments with status "pending" or "in-progress" for a specific dentist
func (s *TreatmentService) GetTreatmentQueueForDentist(dentistID int) ([]models.PatientTreatment, error) {
	rows, err := s.db.Query(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.first_name || ' ' || p.last_name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.status IN ('pending', 'in-progress') AND pt.dentist_id = $1
		ORDER BY pt.priority DESC, pt.created_at ASC`, dentistID)

	if err != nil {
		return nil, fmt.Errorf("failed to query treatment queue: %w", err)
	}
	defer rows.Close()

	var treatments []models.PatientTreatment
	for rows.Next() {
		var pt models.PatientTreatment
		var dentistIDNull sql.NullInt64
		var completionDate sql.NullString
		var dentistName sql.NullString

		err := rows.Scan(
			&pt.ID, &pt.PatientID, &pt.TreatmentID, &dentistIDNull, &pt.PatientName,
			&pt.TreatmentName, &dentistName, &pt.Status, &pt.Priority,
			&pt.StartDate, &completionDate, &pt.Notes, &pt.CreatedAt, &pt.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle null values
		if dentistIDNull.Valid {
			pt.DentistID = int(dentistIDNull.Int64)
		}
		
		if completionDate.Valid {
			pt.CompletionDate = completionDate.String
		}
		
		if dentistName.Valid {
			pt.DentistName = dentistName.String
		}

		treatments = append(treatments, pt)
	}

	// Check for errors that occurred during iteration
	if err = rows.Err(); err != nil {
		return nil, err
	}

	return treatments, nil
}

// GetPatientTreatments retrieves all treatments for a specific patient
func (s *TreatmentService) GetPatientTreatments(patientID int) ([]models.PatientTreatment, error) {
	// First check if the patient exists
	var patientCount int
	err := s.db.QueryRow("SELECT COUNT(*) FROM patients WHERE id = $1", patientID).Scan(&patientCount)
	if err != nil {
		return nil, fmt.Errorf("failed to check if patient exists: %w", err)
	}

	if patientCount == 0 {
		return nil, fmt.Errorf("patient with ID %d not found", patientID)
	}

	// Query patient treatments - if none exist, this will simply return an empty result set
	rows, err := s.db.Query(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.first_name || ' ' || p.last_name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.patient_id = $1
		ORDER BY pt.created_at DESC`, patientID)

	if err != nil {
		return nil, fmt.Errorf("failed to query patient treatments: %w", err)
	}
	defer rows.Close()

	var treatments []models.PatientTreatment
	for rows.Next() {
		var pt models.PatientTreatment
		var dentistIDNull sql.NullInt64
		var completionDate sql.NullString
		var dentistName sql.NullString

		err := rows.Scan(
			&pt.ID, &pt.PatientID, &pt.TreatmentID, &dentistIDNull, &pt.PatientName,
			&pt.TreatmentName, &dentistName, &pt.Status, &pt.Priority,
			&pt.StartDate, &completionDate, &pt.Notes, &pt.CreatedAt, &pt.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan patient treatment: %w", err)
		}

		// Handle nullable fields
		if dentistIDNull.Valid {
			dentistIDValue := int(dentistIDNull.Int64)
			pt.DentistID = &dentistIDValue
		}

		if dentistName.Valid {
			pt.DentistName = &dentistName.String
		}

		if completionDate.Valid {
			pt.CompletionDate = &completionDate.String
		}

		treatments = append(treatments, pt)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating patient treatments: %w", err)
	}

	return treatments, nil
}

// CreatePatientTreatment creates a new patient treatment
func (s *TreatmentService) CreatePatientTreatment(req models.CreatePatientTreatmentRequest, dentistID int) (*models.PatientTreatment, error) {
	// Set default values if not provided
	if req.Status == "" {
		req.Status = string(models.PatientTreatmentStatusPending)
	}
	if req.Priority == "" {
		req.Priority = string(models.PatientTreatmentPriorityNormal)
	}

	now := time.Now()

	// Handle completion date
	var completionDateValue interface{}
	if req.CompletionDate != nil && *req.CompletionDate != "" {
		completionDateValue = *req.CompletionDate
	} else {
		completionDateValue = nil
	}

	// For PostgreSQL, use RETURNING to get the inserted ID
	var id int
	err := s.db.QueryRow(`
		INSERT INTO patient_treatments (
			patient_id, treatment_id, dentist_id, status, priority, start_date, completion_date, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id`,
		req.PatientID, req.TreatmentID, dentistID, req.Status, req.Priority, req.StartDate, completionDateValue, req.Notes,
		now, now,
	).Scan(&id)

	if err != nil {
		return nil, fmt.Errorf("failed to insert patient treatment: %w", err)
	}

	// Fetch the created patient treatment with joined data
	var newPatientTreatment models.PatientTreatment
	var completionDate sql.NullString
	var dentistIDNull sql.NullInt64
	var dentistName sql.NullString

	err = s.db.QueryRow(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.first_name || ' ' || p.last_name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.id = $1`, id).Scan(
		&newPatientTreatment.ID, &newPatientTreatment.PatientID, &newPatientTreatment.TreatmentID,
		&dentistIDNull, &newPatientTreatment.PatientName, &newPatientTreatment.TreatmentName,
		&dentistName, &newPatientTreatment.Status, &newPatientTreatment.Priority,
		&newPatientTreatment.StartDate, &completionDate, &newPatientTreatment.Notes,
		&newPatientTreatment.CreatedAt, &newPatientTreatment.UpdatedAt,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to fetch created patient treatment: %w", err)
	}

	// Handle nullable fields
	if dentistIDNull.Valid {
		dentistIDValue := int(dentistIDNull.Int64)
		newPatientTreatment.DentistID = &dentistIDValue
	}

	if dentistName.Valid {
		newPatientTreatment.DentistName = &dentistName.String
	}

	if completionDate.Valid {
		newPatientTreatment.CompletionDate = &completionDate.String
	}

	return &newPatientTreatment, nil
}

// UpdatePatientTreatment updates an existing patient treatment
func (s *TreatmentService) UpdatePatientTreatment(id int, req models.UpdatePatientTreatmentRequest) (*models.PatientTreatment, error) {
	// Build the update query dynamically based on provided fields
	setParts := []string{"updated_at = $1"}
	args := []interface{}{time.Now()}

	argIndex := 2 // Start from $2 since $1 is used for updated_at

	if req.PatientID != 0 {
		setParts = append(setParts, "patient_id = $"+strconv.Itoa(argIndex))
		args = append(args, req.PatientID)
		argIndex++
	}

	if req.TreatmentID != 0 {
		setParts = append(setParts, "treatment_id = $"+strconv.Itoa(argIndex))
		args = append(args, req.TreatmentID)
		argIndex++
	}

	if req.Status != "" {
		setParts = append(setParts, "status = $"+strconv.Itoa(argIndex))
		args = append(args, req.Status)
		argIndex++
	}

	if req.Priority != "" {
		setParts = append(setParts, "priority = $"+strconv.Itoa(argIndex))
		args = append(args, req.Priority)
		argIndex++
	}

	if req.StartDate != "" {
		setParts = append(setParts, "start_date = $"+strconv.Itoa(argIndex))
		args = append(args, req.StartDate)
		argIndex++
	}

	if req.CompletionDate != nil {
		if *req.CompletionDate == "" {
			setParts = append(setParts, "completion_date = NULL")
		} else {
			setParts = append(setParts, "completion_date = $"+strconv.Itoa(argIndex))
			args = append(args, *req.CompletionDate)
			argIndex++
		}
	}

	if req.Notes != "" {
		setParts = append(setParts, "notes = $"+strconv.Itoa(argIndex))
		args = append(args, req.Notes)
		argIndex++
	}

	// Add the WHERE clause parameter
	args = append(args, id)

	query := fmt.Sprintf("UPDATE patient_treatments SET %s WHERE id = $%d",
		joinStrings(setParts, ", "), argIndex)

	result, err := s.db.Exec(query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to update patient treatment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return nil, fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return nil, sql.ErrNoRows
	}

	// Retrieve the updated patient treatment
	var updatedPatientTreatment models.PatientTreatment
	var completionDate sql.NullString
	var dentistIDNull sql.NullInt64
	var dentistName sql.NullString

	err = s.db.QueryRow(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.first_name || ' ' || p.last_name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.id = $1`, id).Scan(
		&updatedPatientTreatment.ID, &updatedPatientTreatment.PatientID, &updatedPatientTreatment.TreatmentID,
		&dentistIDNull, &updatedPatientTreatment.PatientName, &updatedPatientTreatment.TreatmentName,
		&dentistName, &updatedPatientTreatment.Status, &updatedPatientTreatment.Priority,
		&updatedPatientTreatment.StartDate, &completionDate, &updatedPatientTreatment.Notes,
		&updatedPatientTreatment.CreatedAt, &updatedPatientTreatment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch updated patient treatment: %w", err)
	}

	// Handle nullable fields
	if dentistIDNull.Valid {
		dentistIDValue := int(dentistIDNull.Int64)
		updatedPatientTreatment.DentistID = &dentistIDValue
	}

	if dentistName.Valid {
		updatedPatientTreatment.DentistName = &dentistName.String
	}

	if completionDate.Valid {
		updatedPatientTreatment.CompletionDate = &completionDate.String
	}

	return &updatedPatientTreatment, nil
}

// DeletePatientTreatment deletes a patient treatment by ID
func (s *TreatmentService) DeletePatientTreatment(id int) error {
	result, err := s.db.Exec("DELETE FROM patient_treatments WHERE id = $1", id)
	if err != nil {
		return fmt.Errorf("failed to delete patient treatment: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// joinStrings joins a slice of strings with a separator
func joinStrings(parts []string, separator string) string {
	if len(parts) == 0 {
		return ""
	}

	result := parts[0]
	for _, part := range parts[1:] {
		result += separator + part
	}
	return result
}
