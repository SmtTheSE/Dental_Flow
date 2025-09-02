// src/services/treatmentService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface Treatment {
  id: number;
  name: string;
  description: string;
  cost: number;
  duration: number; // in minutes
  category: string;
}

export interface PatientTreatment {
  id: number;
  patientId: number;
  treatmentId: number;
  dentistId: number | null;
  patientName: string;
  treatmentName: string;
  dentistName: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startDate: string;
  completionDate: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentRequest {
  name: string;
  description: string;
  cost: number;
  duration: number;
  category: string;
}

export interface UpdateTreatmentRequest {
  name?: string;
  description?: string;
  cost?: number;
  duration?: number;
  category?: string;
}

export interface CreatePatientTreatmentRequest {
  patientId: number;
  treatmentId: number;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  startDate: string;
  completionDate?: string | null;
  notes: string;
}

export interface UpdatePatientTreatmentRequest {
  patientId?: number;
  treatmentId?: number;
  dentistId?: number | null;
  status?: 'pending' | 'in-progress' | 'completed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  startDate?: string;
  completionDate?: string | null;
  notes?: string;
}

class TreatmentService {
  // Helper method to get auth headers with validation
  private getAuthHeaders() {
    const token = localStorage.getItem('dental_token');
    
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }
    
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // Helper method to handle API errors
  private handleApiError(error: any) {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('dental_token');
      throw new Error('Authentication expired. Please log in again.');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied. Insufficient permissions.');
    } else if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    } else {
      throw new Error('An unexpected error occurred.');
    }
  }

  // TREATMENT METHODS

  async getAllTreatments(): Promise<Treatment[]> {
    try {
      const response = await axios.get<Treatment[]>(
        `${API_BASE_URL}/api/treatments`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error; // This line will never be reached due to handleApiError always throwing
    }
  }

  async getTreatmentById(id: number): Promise<Treatment> {
    try {
      const response = await axios.get<Treatment>(
        `${API_BASE_URL}/api/treatments/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async createTreatment(treatment: CreateTreatmentRequest): Promise<Treatment> {
    try {
      const response = await axios.post<Treatment>(
        `${API_BASE_URL}/api/treatments`,
        treatment,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async updateTreatment(id: number, treatment: UpdateTreatmentRequest): Promise<Treatment> {
    try {
      const response = await axios.put<Treatment>(
        `${API_BASE_URL}/api/treatments/${id}`,
        treatment,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async deleteTreatment(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/treatments/${id}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  // PATIENT TREATMENT METHODS

  async getAllPatientTreatments(): Promise<PatientTreatment[]> {
    try {
      const response = await axios.get<PatientTreatment[]>(
        `${API_BASE_URL}/api/patient-treatments`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getPatientTreatmentById(id: number): Promise<PatientTreatment> {
    try {
      const response = await axios.get<PatientTreatment>(
        `${API_BASE_URL}/api/patient-treatments/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async createPatientTreatment(treatment: CreatePatientTreatmentRequest): Promise<PatientTreatment> {
    try {
      const response = await axios.post<PatientTreatment>(
        `${API_BASE_URL}/api/patient-treatments`,
        treatment,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async updatePatientTreatment(id: number, treatment: UpdatePatientTreatmentRequest): Promise<PatientTreatment> {
    try {
      const response = await axios.put<PatientTreatment>(
        `${API_BASE_URL}/api/patient-treatments/${id}`,
        treatment,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async deletePatientTreatment(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/patient-treatments/${id}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async getPatientTreatmentsByPatientId(patientId: number): Promise<PatientTreatment[]> {
    try {
      const response = await axios.get<PatientTreatment[]>(
        `${API_BASE_URL}/api/patients/${patientId}/treatments`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }
}

export default new TreatmentService();