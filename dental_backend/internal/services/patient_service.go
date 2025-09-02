// dental_backend/internal/services/patient_service.go
package services

import (
	"database/sql"
	"dental_backend/internal/models"
	"fmt"
	"strings"
	"time"
)

// PatientService provides business logic for patient operations
type PatientService struct {
	db *sql.DB
}

// PatientStats represents statistics about patients
type PatientStats struct {
	TotalPatients      int `json:"totalPatients"`
	LowRiskPatients    int `json:"lowRiskPatients"`
	MediumRiskPatients int `json:"mediumRiskPatients"`
	HighRiskPatients   int `json:"highRiskPatients"`
}

// NewPatientService creates a new patient service
func NewPatientService(db *sql.DB) *PatientService {
	return &PatientService{db: db}
}

// GetAllPatients retrieves all patients with optional filtering
func (s *PatientService) GetAllPatients(search, status string) ([]models.Patient, error) {
	query := `
		SELECT id, first_name, last_name, date_of_birth, phone, email, address,
		       emergency_contact, insurance_provider, insurance_policy_number,
		       medical_history, risk_level, created_at, updated_at
		FROM patients 
		WHERE 1=1`

	args := []interface{}{}
	argCount := 1

	if search != "" {
		placeholder1 := fmt.Sprintf("$%d", argCount)
		placeholder2 := fmt.Sprintf("$%d", argCount+1)
		placeholder3 := fmt.Sprintf("$%d", argCount+2)
		placeholder4 := fmt.Sprintf("$%d", argCount+3)
		query += fmt.Sprintf(" AND (first_name ILIKE %s OR last_name ILIKE %s OR email ILIKE %s OR phone ILIKE %s)", placeholder1, placeholder2, placeholder3, placeholder4)
		args = append(args, "%"+search+"%", "%"+search+"%", "%"+search+"%", "%"+search+"%")
		argCount += 4
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
		err := rows.Scan(
			&p.ID, &p.FirstName, &p.LastName, &p.DateOfBirth, &p.Phone, &p.Email,
			&p.Address, &p.EmergencyContact, &p.InsuranceProvider, &p.InsurancePolicyNumber,
			&p.MedicalHistory, &p.RiskLevel, &p.CreatedAt, &p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		patients = append(patients, p)
	}

	return patients, rows.Err()
}

// GetPatientByID retrieves a single patient by ID
func (s *PatientService) GetPatientByID(id int) (*models.Patient, error) {
	var p models.Patient
	err := s.db.QueryRow(`
		SELECT id, first_name, last_name, date_of_birth, phone, email, address,
		       emergency_contact, insurance_provider, insurance_policy_number,
		       medical_history, risk_level, created_at, updated_at
		FROM patients 
		WHERE id = $1`, id).Scan(
		&p.ID, &p.FirstName, &p.LastName, &p.DateOfBirth, &p.Phone, &p.Email,
		&p.Address, &p.EmergencyContact, &p.InsuranceProvider, &p.InsurancePolicyNumber,
		&p.MedicalHistory, &p.RiskLevel, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &p, nil
}

// CreatePatient creates a new patient record
func (s *PatientService) CreatePatient(req models.CreatePatientRequest) (*models.Patient, error) {
	var p models.Patient

	// Set default risk level if not provided
	riskLevel := req.RiskLevel
	if riskLevel == "" {
		riskLevel = string(models.RiskLevelLow)
	}

	// Set created_at and updated_at to current time
	now := time.Now()

	err := s.db.QueryRow(`
		INSERT INTO patients (
			first_name, last_name, date_of_birth, phone, email, address,
			emergency_contact, insurance_provider, insurance_policy_number,
			medical_history, risk_level, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, first_name, last_name, date_of_birth, phone, email, address,
		          emergency_contact, insurance_provider, insurance_policy_number,
		          medical_history, risk_level, created_at, updated_at`,
		req.FirstName, req.LastName, req.DateOfBirth, req.Phone, req.Email,
		req.Address, req.EmergencyContact, req.InsuranceProvider, req.InsurancePolicyNumber,
		req.MedicalHistory, riskLevel, now, now,
	).Scan(
		&p.ID, &p.FirstName, &p.LastName, &p.DateOfBirth, &p.Phone, &p.Email,
		&p.Address, &p.EmergencyContact, &p.InsuranceProvider, &p.InsurancePolicyNumber,
		&p.MedicalHistory, &p.RiskLevel, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &p, nil
}

// UpdatePatient updates an existing patient record
func (s *PatientService) UpdatePatient(id int, req models.UpdatePatientRequest) (*models.Patient, error) {
	// Build dynamic query based on provided fields
	var setParts []string
	var args []interface{}
	argCount := 1

	if req.FirstName != "" {
		setParts = append(setParts, fmt.Sprintf("first_name = $%d", argCount))
		args = append(args, req.FirstName)
		argCount++
	}

	if req.LastName != "" {
		setParts = append(setParts, fmt.Sprintf("last_name = $%d", argCount))
		args = append(args, req.LastName)
		argCount++
	}

	if req.DateOfBirth != "" {
		setParts = append(setParts, fmt.Sprintf("date_of_birth = $%d", argCount))
		args = append(args, req.DateOfBirth)
		argCount++
	}

	if req.Phone != "" {
		setParts = append(setParts, fmt.Sprintf("phone = $%d", argCount))
		args = append(args, req.Phone)
		argCount++
	}

	if req.Email != "" {
		setParts = append(setParts, fmt.Sprintf("email = $%d", argCount))
		args = append(args, req.Email)
		argCount++
	}

	if req.Address != "" {
		setParts = append(setParts, fmt.Sprintf("address = $%d", argCount))
		args = append(args, req.Address)
		argCount++
	}

	if req.EmergencyContact != "" {
		setParts = append(setParts, fmt.Sprintf("emergency_contact = $%d", argCount))
		args = append(args, req.EmergencyContact)
		argCount++
	}

	if req.InsuranceProvider != "" {
		setParts = append(setParts, fmt.Sprintf("insurance_provider = $%d", argCount))
		args = append(args, req.InsuranceProvider)
		argCount++
	}

	if req.InsurancePolicyNumber != "" {
		setParts = append(setParts, fmt.Sprintf("insurance_policy_number = $%d", argCount))
		args = append(args, req.InsurancePolicyNumber)
		argCount++
	}

	if req.MedicalHistory != "" {
		setParts = append(setParts, fmt.Sprintf("medical_history = $%d", argCount))
		args = append(args, req.MedicalHistory)
		argCount++
	}

	if req.RiskLevel != "" {
		setParts = append(setParts, fmt.Sprintf("risk_level = $%d", argCount))
		args = append(args, req.RiskLevel)
		argCount++
	}

	// Always update the updated_at timestamp
	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", argCount))
	args = append(args, time.Now())
	argCount++

	// If no fields to update, return the existing patient
	if len(setParts) == 1 { // Only updated_at would be set
		return s.GetPatientByID(id)
	}

	// Add ID to args
	args = append(args, id)

	// Build the query
	query := fmt.Sprintf(
		"UPDATE patients SET %s WHERE id = $%d RETURNING id, first_name, last_name, date_of_birth, phone, email, address, emergency_contact, insurance_provider, insurance_policy_number, medical_history, risk_level, created_at, updated_at",
		strings.Join(setParts, ", "),
		argCount,
	)

	var p models.Patient
	err := s.db.QueryRow(query, args...).Scan(
		&p.ID, &p.FirstName, &p.LastName, &p.DateOfBirth, &p.Phone, &p.Email,
		&p.Address, &p.EmergencyContact, &p.InsuranceProvider, &p.InsurancePolicyNumber,
		&p.MedicalHistory, &p.RiskLevel, &p.CreatedAt, &p.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &p, nil
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

// GetPatientStats retrieves statistics about patients
func (s *PatientService) GetPatientStats() (*PatientStats, error) {
	var stats PatientStats

	// Get total patients count
	err := s.db.QueryRow("SELECT COUNT(*) FROM patients").Scan(&stats.TotalPatients)
	if err != nil {
		return nil, err
	}

	// Get low risk patients count
	err = s.db.QueryRow("SELECT COUNT(*) FROM patients WHERE risk_level = 'low'").Scan(&stats.LowRiskPatients)
	if err != nil {
		return nil, err
	}

	// Get medium risk patients count
	err = s.db.QueryRow("SELECT COUNT(*) FROM patients WHERE risk_level = 'medium'").Scan(&stats.MediumRiskPatients)
	if err != nil {
		return nil, err
	}

	// Get high risk patients count
	err = s.db.QueryRow("SELECT COUNT(*) FROM patients WHERE risk_level = 'high'").Scan(&stats.HighRiskPatients)
	if err != nil {
		return nil, err
	}

	return &stats, nil
}
