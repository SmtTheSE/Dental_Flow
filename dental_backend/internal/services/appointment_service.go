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

// GetTodaysAppointments retrieves all appointments for today
func (s *AppointmentService) GetTodaysAppointments() ([]models.Appointment, error) {
	today := time.Now().Format("2006-01-02")

	rows, err := s.db.Query(`
		SELECT a.id, a.patient_id, a.dentist_id, p.name as patient_name, u.first_name || ' ' || u.last_name as dentist_name,
		       a.appointment_date, a.start_time, a.end_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		JOIN users u ON a.dentist_id = u.id
		WHERE a.appointment_date = $1
		ORDER BY a.start_time ASC`, today)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []models.Appointment
	for rows.Next() {
		var a models.Appointment
		err := rows.Scan(
			&a.ID, &a.PatientID, &a.DentistID, &a.PatientName, &a.DentistName,
			&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.Status, &a.Notes,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}

	return appointments, rows.Err()
}

// GetAllAppointments retrieves all appointments with optional filtering
func (s *AppointmentService) GetAllAppointments(date, status, patientID string) ([]models.Appointment, error) {
	query := `
		SELECT a.id, a.patient_id, a.dentist_id, p.name as patient_name, u.first_name || ' ' || u.last_name as dentist_name,
		       a.appointment_date, a.start_time, a.end_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		JOIN users u ON a.dentist_id = u.id
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

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
			&a.ID, &a.PatientID, &a.DentistID, &a.PatientName, &a.DentistName,
			&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.Status, &a.Notes,
			&a.CreatedAt, &a.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}

	return appointments, rows.Err()
}

// GetAppointmentByID retrieves a single appointment by ID
func (s *AppointmentService) GetAppointmentByID(id int) (*models.Appointment, error) {
	var a models.Appointment
	err := s.db.QueryRow(`
		SELECT a.id, a.patient_id, a.dentist_id, p.name as patient_name, u.first_name || ' ' || u.last_name as dentist_name,
		       a.appointment_date, a.start_time, a.end_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		JOIN users u ON a.dentist_id = u.id
		WHERE a.id = $1`, id).Scan(
		&a.ID, &a.PatientID, &a.DentistID, &a.PatientName, &a.DentistName,
		&a.AppointmentDate, &a.StartTime, &a.EndTime, &a.Status, &a.Notes,
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

// CreateAppointment creates a new appointment
func (s *AppointmentService) CreateAppointment(req models.CreateAppointmentRequest) (*models.Appointment, error) {
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
			patient_id, dentist_id, appointment_date, start_time, end_time, status, notes, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, patient_id, dentist_id, 
		          (SELECT name FROM patients WHERE id = $1),
		          (SELECT first_name || ' ' || last_name FROM users WHERE id = $2),
		          appointment_date, start_time, end_time, status, notes, created_at, updated_at`,
		req.PatientID, req.DentistID, req.AppointmentDate, req.StartTime, req.EndTime, req.Status, req.Notes,
	).Scan(
		&newAppointment.ID, &newAppointment.PatientID, &newAppointment.DentistID,
		&newAppointment.PatientName, &newAppointment.DentistName,
		&newAppointment.AppointmentDate, &newAppointment.StartTime, &newAppointment.EndTime,
		&newAppointment.Status, &newAppointment.Notes, &newAppointment.CreatedAt, &newAppointment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &newAppointment, nil
}

// UpdateAppointment updates an existing appointment
func (s *AppointmentService) UpdateAppointment(id int, req models.UpdateAppointmentRequest) (*models.Appointment, error) {
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

	// Build the update query dynamically based on provided fields
	query := "UPDATE appointments SET updated_at = NOW()"
	args := []interface{}{id}
	argCount := 2

	if req.PatientID != 0 {
		placeholder := argCount
		query += ", patient_id = $" + formatInt(placeholder)
		args = append(args, req.PatientID)
		argCount++
	}

	if req.DentistID != 0 {
		placeholder := argCount
		query += ", dentist_id = $" + formatInt(placeholder)
		args = append(args, req.DentistID)
		argCount++
	}

	if req.AppointmentDate != "" {
		placeholder := argCount
		query += ", appointment_date = $" + formatInt(placeholder)
		args = append(args, req.AppointmentDate)
		argCount++
	}

	if req.StartTime != "" {
		placeholder := argCount
		query += ", start_time = $" + formatInt(placeholder)
		args = append(args, req.StartTime)
		argCount++
	}

	if req.EndTime != "" {
		placeholder := argCount
		query += ", end_time = $" + formatInt(placeholder)
		args = append(args, req.EndTime)
		argCount++
	}

	if req.Status != "" {
		placeholder := argCount
		query += ", status = $" + formatInt(placeholder)
		args = append(args, req.Status)
		argCount++
	}

	if req.Notes != "" {
		placeholder := argCount
		query += ", notes = $" + formatInt(placeholder)
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

	// Retrieve the updated appointment
	var updatedAppointment models.Appointment
	err = s.db.QueryRow(`
		SELECT a.id, a.patient_id, a.dentist_id, p.name as patient_name, u.first_name || ' ' || u.last_name as dentist_name,
		       a.appointment_date, a.start_time, a.end_time, a.status, a.notes, a.created_at, a.updated_at
		FROM appointments a
		JOIN patients p ON a.patient_id = p.id
		JOIN users u ON a.dentist_id = u.id
		WHERE a.id = $1`, id).Scan(
		&updatedAppointment.ID, &updatedAppointment.PatientID, &updatedAppointment.DentistID,
		&updatedAppointment.PatientName, &updatedAppointment.DentistName,
		&updatedAppointment.AppointmentDate, &updatedAppointment.StartTime, &updatedAppointment.EndTime,
		&updatedAppointment.Status, &updatedAppointment.Notes, &updatedAppointment.CreatedAt, &updatedAppointment.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &updatedAppointment, nil
}

// DeleteAppointment deletes an appointment by ID
func (s *AppointmentService) DeleteAppointment(id int) error {
	result, err := s.db.Exec("DELETE FROM appointments WHERE id = $1", id)
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

// GetAppointmentStats retrieves appointment statistics
func (s *AppointmentService) GetAppointmentStats() (map[string]int, error) {
	stats := make(map[string]int)

	// Get total appointments
	var total int
	err := s.db.QueryRow("SELECT COUNT(*) FROM appointments").Scan(&total)
	if err != nil {
		return nil, err
	}
	stats["total"] = total

	// Get today's appointments
	today := time.Now().Format("2006-01-02")
	var todayCount int
	err = s.db.QueryRow("SELECT COUNT(*) FROM appointments WHERE appointment_date = $1", today).Scan(&todayCount)
	if err != nil {
		return nil, err
	}
	stats["today"] = todayCount

	// Get scheduled appointments
	var scheduled int
	err = s.db.QueryRow("SELECT COUNT(*) FROM appointments WHERE status = 'scheduled'").Scan(&scheduled)
	if err != nil {
		return nil, err
	}
	stats["scheduled"] = scheduled

	return stats, nil
}

// ValidationError represents a validation error
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

// Helper function to format integer as string
func formatInt(i int) string {
	// Simple implementation for small integers
	if i < 0 || i > 15 {
		return ""
	}
	return []string{"0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"}[i]
}
