// dental_backend/internal/services/appointment_service.go
package services

import (
	"database/sql"
	"dental_backend/internal/models"
	"time"
)

// AppointmentService provides business logic for appointment operations
type AppointmentService struct {
	db *sql.DB
}

// NewAppointmentService creates a new appointment service
func NewAppointmentService(db *sql.DB) *AppointmentService {
	return &AppointmentService{db: db}
}

// GetTodaysAppointments retrieves all appointments for today for the logged-in dentist
func (s *AppointmentService) GetTodaysAppointments(dentistID int) ([]models.Appointment, error) {
	today := time.Now().Format("2006-01-02")

	rows, err := s.db.Query(`
		SELECT a.id, a.patient_id,
		       p.first_name || ' ' || p.last_name as patient_name, 
		       a.appointment_date, a.start_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		WHERE a.appointment_date = $1 AND a.dentist_id = $2
		ORDER BY a.start_time ASC`, today, dentistID)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []models.Appointment
	for rows.Next() {
		var a models.Appointment
		err := rows.Scan(
			&a.ID, &a.PatientID, &a.PatientName,
			&a.AppointmentDate, &a.StartTime, &a.Status, &a.Notes,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}

	return appointments, rows.Err()
}

// GetAllAppointments retrieves all appointments with optional filtering for the logged-in dentist
func (s *AppointmentService) GetAllAppointments(dentistID int, date, status, patientID string) ([]models.Appointment, error) {
	query := `
		SELECT a.id, a.patient_id,
		       p.first_name || ' ' || p.last_name as patient_name, 
		       a.appointment_date, a.start_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		WHERE a.dentist_id = $1`

	args := []interface{}{dentistID}
	argCount := 2

	if date != "" {
		placeholder := argCount
		query += " AND a.appointment_date = $" + formatInt(placeholder)
		args = append(args, date)
		argCount++
	}

	if status != "" {
		placeholder := argCount
		query += " AND a.status = $" + formatInt(placeholder)
		args = append(args, status)
		argCount++
	}

	if patientID != "" {
		placeholder := argCount
		query += " AND a.patient_id = $" + formatInt(placeholder)
		args = append(args, patientID)
		argCount++
	}

	query += " ORDER BY a.appointment_date DESC, a.start_time ASC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []models.Appointment
	for rows.Next() {
		var a models.Appointment
		err := rows.Scan(
			&a.ID, &a.PatientID, &a.PatientName,
			&a.AppointmentDate, &a.StartTime, &a.Status, &a.Notes,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}

	return appointments, rows.Err()
}

// GetAppointmentByID retrieves a single appointment by ID for the logged-in dentist
func (s *AppointmentService) GetAppointmentByID(id int, dentistID int) (*models.Appointment, error) {
	var a models.Appointment
	err := s.db.QueryRow(`
		SELECT a.id, a.patient_id,
		       p.first_name || ' ' || last_name as patient_name, 
		       a.appointment_date, a.start_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		WHERE a.id = $1 AND a.dentist_id = $2`, id, dentistID).Scan(
		&a.ID, &a.PatientID, &a.PatientName,
		&a.AppointmentDate, &a.StartTime, &a.Status, &a.Notes,
		&a.CreatedAt, &a.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &a, nil
}

// CreateAppointment creates a new appointment associated with the logged-in dentist
func (s *AppointmentService) CreateAppointment(req models.CreateAppointmentRequest, dentistID int) (*models.Appointment, error) {
	// Validate that the appointment time is in the future
	appDate, err := time.Parse("2006-01-02", req.AppointmentDate)
	if err != nil {
		return nil, err
	}

	// Check if appointment date is in the past
	today := time.Now().Truncate(24 * time.Hour)
	if appDate.Before(today) {
		return nil, &ValidationError{"Appointment date cannot be in the past"}
	}

	// Set default status if not provided
	if req.Status == "" {
		req.Status = string(models.AppointmentStatusScheduled)
	}

	var newAppointment models.Appointment
	err = s.db.QueryRow(`
		INSERT INTO appointments (
			patient_id, dentist_id, appointment_date, start_time, status, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id, patient_id,
		          (SELECT first_name || ' ' || last_name FROM patients WHERE id = $1),
		          appointment_date, start_time, status, notes, created_at, updated_at`,
		req.PatientID, dentistID, req.AppointmentDate, req.StartTime, req.Status, req.Notes,
	).Scan(
		&newAppointment.ID, &newAppointment.PatientID,
		&newAppointment.PatientName,
		&newAppointment.AppointmentDate, &newAppointment.StartTime, &newAppointment.Status,
		&newAppointment.Notes, &newAppointment.CreatedAt, &newAppointment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &newAppointment, nil
}

// UpdateAppointment updates an existing appointment for the logged-in dentist
func (s *AppointmentService) UpdateAppointment(id int, req models.UpdateAppointmentRequest, dentistID int) (*models.Appointment, error) {
	// If appointment date is provided, validate it
	if req.AppointmentDate != "" {
		appDate, err := time.Parse("2006-01-02", req.AppointmentDate)
		if err != nil {
			return nil, err
		}

		// Check if appointment date is in the past
		today := time.Now().Truncate(24 * time.Hour)
		if appDate.Before(today) {
			return nil, &ValidationError{"Appointment date cannot be in the past"}
		}
	}

	// Set default status if not provided
	if req.Status == "" {
		req.Status = string(models.AppointmentStatusScheduled)
	}

	// Build dynamic update query
	query := "UPDATE appointments SET updated_at = NOW()"
	args := []interface{}{id, dentistID}
	argIndex := 3 // Starting index for arguments

	if req.PatientID != 0 {
		query += ", patient_id = $" + formatInt(argIndex)
		args = append(args, req.PatientID)
		argIndex++
	}

	if req.AppointmentDate != "" {
		query += ", appointment_date = $" + formatInt(argIndex)
		args = append(args, req.AppointmentDate)
		argIndex++
	}

	if req.StartTime != "" {
		query += ", start_time = $" + formatInt(argIndex)
		args = append(args, req.StartTime)
		argIndex++
	}

	if req.Status != "" {
		query += ", status = $" + formatInt(argIndex)
		args = append(args, req.Status)
		argIndex++
	}

	if req.Notes != "" {
		query += ", notes = $" + formatInt(argIndex)
		args = append(args, req.Notes)
		argIndex++
	}

	query += " WHERE id = $1 AND dentist_id = $2 RETURNING id, patient_id, " +
		"(SELECT first_name || ' ' || last_name FROM patients WHERE id = patient_id), " +
		"appointment_date, start_time, status, notes, created_at, updated_at"

	args = append(args, id, dentistID)

	var updatedAppointment models.Appointment
	err := s.db.QueryRow(query, args...).Scan(
		&updatedAppointment.ID, &updatedAppointment.PatientID,
		&updatedAppointment.PatientName,
		&updatedAppointment.AppointmentDate, &updatedAppointment.StartTime, &updatedAppointment.Status,
		&updatedAppointment.Notes, &updatedAppointment.CreatedAt, &updatedAppointment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &updatedAppointment, nil
}

// DeleteAppointment deletes an appointment for the logged-in dentist
func (s *AppointmentService) DeleteAppointment(id int, dentistID int) error {
	result, err := s.db.Exec("DELETE FROM appointments WHERE id = $1 AND dentist_id = $2", id, dentistID)
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

// ValidationError represents a validation error
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// formatInt converts an integer to a string
// This is a helper function to avoid using fmt.Sprintf in query building
func formatInt(i int) string {
	return []string{
		"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
		"11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
	}[i]
}
