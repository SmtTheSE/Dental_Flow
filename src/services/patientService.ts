// src/services/patientService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  medicalHistory: string;
  riskLevel: 'low' | 'medium' | 'high';
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  emergencyContact: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  medicalHistory: string;
  riskLevel: 'low' | 'medium' | 'high';
}

class PatientService {
  // Helper method to get auth headers
  private getAuthHeaders() {
    const token = localStorage.getItem('dental_token');
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // Get all patients with optional search and filter parameters
  async getAllPatients(search?: string, status?: string): Promise<Patient[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      
      // Fix the URL construction to properly include the query parameters
      const url = `${API_BASE_URL}/api/patients${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await axios.get<Patient[]>(
        url,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  // Get a specific patient by ID
  async getPatientById(id: number): Promise<Patient> {
    try {
      const response = await axios.get<Patient>(
        `${API_BASE_URL}/api/patients/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching patient with ID ${id}:`, error);
      throw error;
    }
  }

  // Create a new patient
  async createPatient(patient: CreatePatientRequest): Promise<Patient> {
    try {
      const response = await axios.post<Patient>(
        `${API_BASE_URL}/api/patients`,
        patient,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  // Update an existing patient
  async updatePatient(id: number, patient: Partial<CreatePatientRequest>): Promise<Patient> {
    try {
      const response = await axios.put<Patient>(
        `${API_BASE_URL}/api/patients/${id}`,
        patient,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating patient with ID ${id}:`, error);
      throw error;
    }
  }

  // Delete a patient
  async deletePatient(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/patients/${id}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error(`Error deleting patient with ID ${id}:`, error);
      throw error;
    }
  }
}

const patientService = new PatientService();
export { patientService as default, patientService };
