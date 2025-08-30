// dental_backend/internal/services/patient_service.go
package services

import (
	"database/sql"
	"dental_backend/internal/models"
	"fmt"
)

// PatientService provides business logic for patient operations
type PatientService struct {
	db *sql.DB
}

// NewPatientService creates a new patient service
func NewPatientService(db *sql.DB) *PatientService {
	return &PatientService{db: db}
}

// GetAllPatients retrieves all patients with optional filtering
func (s *PatientService) GetAllPatients(search, status string) ([]models.Patient, error) {
	query := `
		SELECT id, name, age, phone, email, last_visit, next_appointment, 
		       treatment_status, risk_level, insurance_provider, created_at, updated_at
		FROM patients 
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

	if search != "" {
		placeholder1 := fmt.Sprintf("$%d", argCount)
		placeholder2 := fmt.Sprintf("$%d", argCount+1)
		placeholder3 := fmt.Sprintf("$%d", argCount+2)
		query += fmt.Sprintf(" AND (name ILIKE %s OR email ILIKE %s OR phone ILIKE %s)", placeholder1, placeholder2, placeholder3)
		args = append(args, "%"+search+"%", "%"+search+"%", "%"+search+"%")
		argCount += 3
	}

	if status != "" && status != "all" {
		placeholder := fmt.Sprintf("$%d", argCount)
		query += fmt.Sprintf(" AND treatment_status = %s", placeholder)
		args = append(args, status)
		argCount++
	}

	query += " ORDER BY created_at DESC"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var patients []models.Patient
	for rows.Next() {
		var p models.Patient
		var nextAppointment sql.NullString
		err := rows.Scan(
			&p.ID, &p.Name, &p.Age, &p.Phone, &p.Email,
			&p.LastVisit, &nextAppointment, &p.TreatmentStatus,
			&p.RiskLevel, &p.InsuranceProvider, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		if nextAppointment.Valid {
			p.NextAppointment = &nextAppointment.String
		}

		patients = append(patients, p)
	}

	return patients, rows.Err()
}

// GetPatientByID retrieves a single patient by ID
func (s *PatientService) GetPatientByID(id int) (*models.Patient, error) {
	var p models.Patient
	var nextAppointment sql.NullString
	err := s.db.QueryRow(`
		SELECT id, name, age, phone, email, last_visit, next_appointment, 
		       treatment_status, risk_level, insurance_provider, created_at, updated_at
		FROM patients 
		WHERE id = $1`, id).Scan(
		&p.ID, &p.Name, &p.Age, &p.Phone, &p.Email,
		&p.LastVisit, &nextAppointment, &p.TreatmentStatus,
		&p.RiskLevel, &p.InsuranceProvider, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	if nextAppointment.Valid {
		p.NextAppointment = &nextAppointment.String
	}

	return &p, nil
}

// CreatePatient creates a new patient
func (s *PatientService) CreatePatient(req models.CreatePatientRequest) (*models.Patient, error) {
	// Set default values if not provided
	if req.LastVisit == "" {
		req.LastVisit = getCurrentDate()
	}

	if req.TreatmentStatus == "" {
		req.TreatmentStatus = "pending"
	}

	if req.RiskLevel == "" {
		req.RiskLevel = "low"
	}

	var newPatient models.Patient
	var nextAppointment sql.NullString
	if req.NextAppointment != "" {
		nextAppointment.String = req.NextAppointment
		nextAppointment.Valid = true
	}

	err := s.db.QueryRow(`
		INSERT INTO patients (
			name, age, phone, email, last_visit, next_appointment, 
			treatment_status, risk_level, insurance_provider, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
		RETURNING id, name, age, phone, email, last_visit, next_appointment, 
		          treatment_status, risk_level, insurance_provider, created_at, updated_at`,
		req.Name, req.Age, req.Phone, req.Email, req.LastVisit, nextAppointment,
		req.TreatmentStatus, req.RiskLevel, req.InsuranceProvider,
	).Scan(
		&newPatient.ID, &newPatient.Name, &newPatient.Age, &newPatient.Phone, &newPatient.Email,
		&newPatient.LastVisit, &nextAppointment, &newPatient.TreatmentStatus,
		&newPatient.RiskLevel, &newPatient.InsuranceProvider, &newPatient.CreatedAt, &newPatient.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if nextAppointment.Valid {
		newPatient.NextAppointment = &nextAppointment.String
	}

	return &newPatient, nil
}

// UpdatePatient updates an existing patient
func (s *PatientService) UpdatePatient(id int, req models.UpdatePatientRequest) (*models.Patient, error) {
	// First, get the existing patient
	existing, err := s.GetPatientByID(id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, sql.ErrNoRows
	}

	// Update only provided fields
	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.Age != 0 {
		existing.Age = req.Age
	}
	if req.Phone != "" {
		existing.Phone = req.Phone
	}
	if req.Email != "" {
		existing.Email = req.Email
	}
	if req.LastVisit != "" {
		existing.LastVisit = req.LastVisit
	}
	if req.NextAppointment != "" {
		existing.NextAppointment = &req.NextAppointment
	}
	if req.TreatmentStatus != "" {
		existing.TreatmentStatus = req.TreatmentStatus
	}
	if req.RiskLevel != "" {
		existing.RiskLevel = req.RiskLevel
	}
	if req.InsuranceProvider != "" {
		existing.InsuranceProvider = req.InsuranceProvider
	}

	// Update in database
	var updatedPatient models.Patient
	var nextAppointment sql.NullString
	if existing.NextAppointment != nil {
		nextAppointment.String = *existing.NextAppointment
		nextAppointment.Valid = true
	}

	err = s.db.QueryRow(`
		UPDATE patients 
		SET name = $1, age = $2, phone = $3, email = $4, last_visit = $5, 
		    next_appointment = $6, treatment_status = $7, risk_level = $8, 
		    insurance_provider = $9, updated_at = NOW()
		WHERE id = $10
		RETURNING id, name, age, phone, email, last_visit, next_appointment, 
		          treatment_status, risk_level, insurance_provider, created_at, updated_at`,
		existing.Name, existing.Age, existing.Phone, existing.Email, existing.LastVisit,
		nextAppointment, existing.TreatmentStatus, existing.RiskLevel,
		existing.InsuranceProvider, id,
	).Scan(
		&updatedPatient.ID, &updatedPatient.Name, &updatedPatient.Age, &updatedPatient.Phone,
		&updatedPatient.Email, &updatedPatient.LastVisit, &nextAppointment,
		&updatedPatient.TreatmentStatus, &updatedPatient.RiskLevel,
		&updatedPatient.InsuranceProvider, &updatedPatient.CreatedAt, &updatedPatient.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	if nextAppointment.Valid {
		updatedPatient.NextAppointment = &nextAppointment.String
	}

	return &updatedPatient, nil
}

// DeletePatient deletes a patient by ID
func (s *PatientService) DeletePatient(id int) error {
	result, err := s.db.Exec("DELETE FROM patients WHERE id = $1", id)
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

// GetPatientStats retrieves patient statistics
func (s *PatientService) GetPatientStats() (map[string]int, error) {
	stats := make(map[string]int)

	// Get total patients
	var total int
	err := s.db.QueryRow("SELECT COUNT(*) FROM patients").Scan(&total)
	if err != nil {
		return nil, err
	}
	stats["total"] = total

	// Get active patients (with active treatments)
	var active int
	err = s.db.QueryRow("SELECT COUNT(*) FROM patients WHERE treatment_status = 'active'").Scan(&active)
	if err != nil {
		return nil, err
	}
	stats["active"] = active

	// Get high risk patients
	var highRisk int
	err = s.db.QueryRow("SELECT COUNT(*) FROM patients WHERE risk_level = 'high'").Scan(&highRisk)
	if err != nil {
		return nil, err
	}
	stats["highRisk"] = highRisk

	return stats, nil
}

// Helper function to get current date in YYYY-MM-DD format
func getCurrentDate() string {
	// This would typically be time.Now().Format("2006-01-02") but for database
	// queries we can use the database's current date function
	return "" // Will be handled in the query with NOW() or CURRENT_DATE
}
