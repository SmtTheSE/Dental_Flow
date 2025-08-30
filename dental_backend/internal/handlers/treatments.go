// dental_backend/internal/handlers/treatments.go
package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"time"

	"dental_backend/internal/database"
	"dental_backend/internal/models"

	"github.com/gin-gonic/gin"
)

// GetTreatments retrieves all treatments
func GetTreatments(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	rows, err := db.Query(`
		SELECT id, name, description, cost, duration, category, created_at, updated_at
		FROM treatments
		ORDER BY name ASC`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve treatments"})
		return
	}
	defer rows.Close()

	var treatments []models.Treatment
	for rows.Next() {
		var t models.Treatment
		err := rows.Scan(
			&t.ID, &t.Name, &t.Description, &t.Cost, &t.Duration, &t.Category,
			&t.CreatedAt, &t.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan treatment data"})
			return
		}
		treatments = append(treatments, t)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating treatments"})
		return
	}

	c.JSON(http.StatusOK, treatments)
}

// GetTreatment retrieves a single treatment by ID
func GetTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	treatmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	var t models.Treatment
	err = db.QueryRow(`
		SELECT id, name, description, cost, duration, category, created_at, updated_at
		FROM treatments
		WHERE id = $1`, treatmentID).Scan(
		&t.ID, &t.Name, &t.Description, &t.Cost, &t.Duration, &t.Category,
		&t.CreatedAt, &t.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Treatment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve treatment"})
		return
	}

	c.JSON(http.StatusOK, t)
}

// CreateTreatment creates a new treatment
func CreateTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	var req models.CreateTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default category if not provided
	if req.Category == "" {
		req.Category = string(models.TreatmentCategoryGeneral)
	}

	var newTreatment models.Treatment
	err := db.QueryRow(`
		INSERT INTO treatments (
			name, description, cost, duration, category, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		RETURNING id, name, description, cost, duration, category, created_at, updated_at`,
		req.Name, req.Description, req.Cost, req.Duration, req.Category,
	).Scan(
		&newTreatment.ID, &newTreatment.Name, &newTreatment.Description, &newTreatment.Cost,
		&newTreatment.Duration, &newTreatment.Category, &newTreatment.CreatedAt, &newTreatment.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create treatment"})
		return
	}

	c.JSON(http.StatusCreated, newTreatment)
}

// UpdateTreatment updates an existing treatment
func UpdateTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	treatmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	var req models.UpdateTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build the update query dynamically based on provided fields
	query := "UPDATE treatments SET updated_at = NOW()"
	args := []interface{}{treatmentID}
	argCount := 2

	if req.Name != "" {
		query += ", name = $" + strconv.Itoa(argCount)
		args = append(args, req.Name)
		argCount++
	}

	if req.Description != "" {
		query += ", description = $" + strconv.Itoa(argCount)
		args = append(args, req.Description)
		argCount++
	}

	if req.Cost != 0 {
		query += ", cost = $" + strconv.Itoa(argCount)
		args = append(args, req.Cost)
		argCount++
	}

	if req.Duration != 0 {
		query += ", duration = $" + strconv.Itoa(argCount)
		args = append(args, req.Duration)
		argCount++
	}

	if req.Category != "" {
		query += ", category = $" + strconv.Itoa(argCount)
		args = append(args, req.Category)
		argCount++
	}

	query += " WHERE id = $1"

	result, err := db.Exec(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update treatment"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Treatment not found"})
		return
	}

	// Retrieve the updated treatment
	var updatedTreatment models.Treatment
	err = db.QueryRow(`
		SELECT id, name, description, cost, duration, category, created_at, updated_at
		FROM treatments
		WHERE id = $1`, treatmentID).Scan(
		&updatedTreatment.ID, &updatedTreatment.Name, &updatedTreatment.Description,
		&updatedTreatment.Cost, &updatedTreatment.Duration, &updatedTreatment.Category,
		&updatedTreatment.CreatedAt, &updatedTreatment.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Treatment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated treatment"})
		return
	}

	c.JSON(http.StatusOK, updatedTreatment)
}

// DeleteTreatment deletes a treatment by ID
func DeleteTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	treatmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid treatment ID"})
		return
	}

	result, err := db.Exec("DELETE FROM treatments WHERE id = $1", treatmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete treatment"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Treatment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Treatment deleted successfully"})
}

// GetTreatmentQueue retrieves all patient treatments with status "pending" or "in-progress"
func GetTreatmentQueue(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	rows, err := db.Query(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.status IN ('pending', 'in-progress')
		ORDER BY 
			CASE pt.priority 
				WHEN 'urgent' THEN 1
				WHEN 'high' THEN 2
				WHEN 'normal' THEN 3
				WHEN 'low' THEN 4
			END,
			pt.start_date ASC`)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve treatment queue"})
		return
	}
	defer rows.Close()

	var treatments []models.PatientTreatment
	for rows.Next() {
		var pt models.PatientTreatment
		var completionDate sql.NullString
		var dentistID sql.NullInt64
		var dentistName sql.NullString

		err := rows.Scan(
			&pt.ID, &pt.PatientID, &pt.TreatmentID, &dentistID, &pt.PatientName,
			&pt.TreatmentName, &dentistName, &pt.Status, &pt.Priority, &pt.StartDate,
			&completionDate, &pt.Notes, &pt.CreatedAt, &pt.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan patient treatment data"})
			return
		}

		// Handle nullable fields
		if completionDate.Valid {
			pt.CompletionDate = &completionDate.String
		}

		if dentistID.Valid {
			dentistIDValue := int(dentistID.Int64)
			pt.DentistID = &dentistIDValue
		}

		if dentistName.Valid {
			pt.DentistName = &dentistName.String
		}

		treatments = append(treatments, pt)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating treatment queue"})
		return
	}

	c.JSON(http.StatusOK, treatments)
}

// GetPatientTreatments retrieves all treatments for a specific patient
func GetPatientTreatments(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	patientID := c.Param("patientId")
	pid, err := strconv.Atoi(patientID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient ID"})
		return
	}

	rows, err := db.Query(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.patient_id = $1
		ORDER BY pt.start_date DESC`, pid)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve patient treatments"})
		return
	}
	defer rows.Close()

	var treatments []models.PatientTreatment
	for rows.Next() {
		var pt models.PatientTreatment
		var completionDate sql.NullString
		var dentistID sql.NullInt64
		var dentistName sql.NullString

		err := rows.Scan(
			&pt.ID, &pt.PatientID, &pt.TreatmentID, &dentistID, &pt.PatientName,
			&pt.TreatmentName, &dentistName, &pt.Status, &pt.Priority, &pt.StartDate,
			&completionDate, &pt.Notes, &pt.CreatedAt, &pt.UpdatedAt,
		)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to scan patient treatment data"})
			return
		}

		// Handle nullable fields
		if completionDate.Valid {
			pt.CompletionDate = &completionDate.String
		}

		if dentistID.Valid {
			dentistIDValue := int(dentistID.Int64)
			pt.DentistID = &dentistIDValue
		}

		if dentistName.Valid {
			pt.DentistName = &dentistName.String
		}

		treatments = append(treatments, pt)
	}

	if err = rows.Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error iterating patient treatments"})
		return
	}

	c.JSON(http.StatusOK, treatments)
}

// CreatePatientTreatment creates a new patient treatment
func CreatePatientTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	var req models.CreatePatientTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default values if not provided
	if req.Status == "" {
		// Use the constant from the patient model
		req.Status = "pending"
	}

	if req.Priority == "" {
		// Use the constant from the treatment model
		req.Priority = string(models.PatientTreatmentPriorityNormal)
	}

	if req.StartDate == "" {
		req.StartDate = time.Now().Format("2006-01-02")
	}

	var newPatientTreatment models.PatientTreatment
	var dentistID sql.NullInt64
	var completionDate sql.NullString

	if req.DentistID != nil {
		dentistID.Valid = true
		dentistID.Int64 = int64(*req.DentistID)
	}

	if req.CompletionDate != nil {
		completionDate.Valid = true
		completionDate.String = *req.CompletionDate
	}

	err := db.QueryRow(`
		INSERT INTO patient_treatments (
			patient_id, treatment_id, dentist_id, status, priority, start_date, completion_date, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
		RETURNING id, patient_id, treatment_id, dentist_id, 
		          (SELECT name FROM patients WHERE id = $1),
		          (SELECT name FROM treatments WHERE id = $2),
		          CASE WHEN $3 IS NOT NULL THEN (SELECT first_name || ' ' || last_name FROM users WHERE id = $3) ELSE NULL END,
		          status, priority, start_date, completion_date, notes, created_at, updated_at`,
		req.PatientID, req.TreatmentID, dentistID, req.Status, req.Priority, req.StartDate, completionDate, req.Notes,
	).Scan(
		&newPatientTreatment.ID, &newPatientTreatment.PatientID, &newPatientTreatment.TreatmentID, &dentistID,
		&newPatientTreatment.PatientName, &newPatientTreatment.TreatmentName, &newPatientTreatment.DentistName,
		&newPatientTreatment.Status, &newPatientTreatment.Priority, &newPatientTreatment.StartDate,
		&completionDate, &newPatientTreatment.Notes, &newPatientTreatment.CreatedAt, &newPatientTreatment.UpdatedAt,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient treatment"})
		return
	}

	// Handle nullable fields
	if dentistID.Valid {
		dentistIDValue := int(dentistID.Int64)
		newPatientTreatment.DentistID = &dentistIDValue
	}

	if completionDate.Valid {
		newPatientTreatment.CompletionDate = &completionDate.String
	}

	c.JSON(http.StatusCreated, newPatientTreatment)
}

// UpdatePatientTreatment updates an existing patient treatment
func UpdatePatientTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	treatmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient treatment ID"})
		return
	}

	var req models.UpdatePatientTreatmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build the update query dynamically based on provided fields
	query := "UPDATE patient_treatments SET updated_at = NOW()"
	args := []interface{}{treatmentID}
	argCount := 2

	if req.PatientID != 0 {
		query += ", patient_id = $" + strconv.Itoa(argCount)
		args = append(args, req.PatientID)
		argCount++
	}

	if req.TreatmentID != 0 {
		query += ", treatment_id = $" + strconv.Itoa(argCount)
		args = append(args, req.TreatmentID)
		argCount++
	}

	if req.DentistID != nil {
		query += ", dentist_id = $" + strconv.Itoa(argCount)
		args = append(args, *req.DentistID)
		argCount++
	}

	if req.Status != "" {
		query += ", status = $" + strconv.Itoa(argCount)
		args = append(args, req.Status)
		argCount++
	}

	if req.Priority != "" {
		query += ", priority = $" + strconv.Itoa(argCount)
		args = append(args, req.Priority)
		argCount++
	}

	if req.StartDate != "" {
		query += ", start_date = $" + strconv.Itoa(argCount)
		args = append(args, req.StartDate)
		argCount++
	}

	if req.CompletionDate != nil {
		if *req.CompletionDate == "" {
			query += ", completion_date = NULL"
		} else {
			query += ", completion_date = $" + strconv.Itoa(argCount)
			args = append(args, *req.CompletionDate)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient treatment"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient treatment not found"})
		return
	}

	// Retrieve the updated patient treatment
	var updatedPatientTreatment models.PatientTreatment
	var dentistID sql.NullInt64
	var completionDate sql.NullString

	err = db.QueryRow(`
		SELECT pt.id, pt.patient_id, pt.treatment_id, pt.dentist_id, p.name as patient_name, 
		       t.name as treatment_name, 
		       CASE WHEN pt.dentist_id IS NOT NULL THEN u.first_name || ' ' || u.last_name ELSE NULL END as dentist_name,
		       pt.status, pt.priority, pt.start_date, pt.completion_date, pt.notes, pt.created_at, pt.updated_at
		FROM patient_treatments pt
		JOIN patients p ON pt.patient_id = p.id
		JOIN treatments t ON pt.treatment_id = t.id
		LEFT JOIN users u ON pt.dentist_id = u.id
		WHERE pt.id = $1`, treatmentID).Scan(
		&updatedPatientTreatment.ID, &updatedPatientTreatment.PatientID, &updatedPatientTreatment.TreatmentID,
		&dentistID, &updatedPatientTreatment.PatientName, &updatedPatientTreatment.TreatmentName,
		&updatedPatientTreatment.DentistName, &updatedPatientTreatment.Status, &updatedPatientTreatment.Priority,
		&updatedPatientTreatment.StartDate, &completionDate, &updatedPatientTreatment.Notes,
		&updatedPatientTreatment.CreatedAt, &updatedPatientTreatment.UpdatedAt,
	)

	if err != nil {
		if err.Error() == "sql: no rows in result set" {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient treatment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated patient treatment"})
		return
	}

	// Handle nullable fields
	if dentistID.Valid {
		dentistIDValue := int(dentistID.Int64)
		updatedPatientTreatment.DentistID = &dentistIDValue
	}

	if completionDate.Valid {
		updatedPatientTreatment.CompletionDate = &completionDate.String
	}

	c.JSON(http.StatusOK, updatedPatientTreatment)
}

// DeletePatientTreatment deletes a patient treatment by ID
func DeletePatientTreatment(c *gin.Context) {
	// Get database connection from the shared database package
	db := database.GetDB()

	id := c.Param("id")
	treatmentID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid patient treatment ID"})
		return
	}

	result, err := db.Exec("DELETE FROM patient_treatments WHERE id = $1", treatmentID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete patient treatment"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get rows affected"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient treatment not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Patient treatment deleted successfully"})
}
