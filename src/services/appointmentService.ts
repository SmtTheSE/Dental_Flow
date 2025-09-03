// src/services/appointmentService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface Appointment {
  id: number;
  patientId: number;
  dentistId: number;
  patientName: string;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAppointmentRequest {
  patientId: number;
  dentistId?: number;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
}

export interface UpdateAppointmentRequest {
  patientId?: number;
  dentistId?: number;
  appointmentDate?: string; // YYYY-MM-DD
  startTime?: string; // HH:MM
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
}

class AppointmentService {
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

  // Get the current user's ID
  private getCurrentUserId(): number {
    const user = localStorage.getItem('dental_user');
    if (user) {
      const userData = JSON.parse(user);
      return userData.id;
    }
    return 0;
  }

  // Get today's appointments
  async getTodaysAppointments(): Promise<Appointment[]> {
    try {
      const response = await axios.get<Appointment[]>(
        `${API_BASE_URL}/api/appointments/today`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  // Get all appointments with optional filters
  async getAppointments(
    date?: string,
    status?: string,
    patientId?: string
  ): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams();
      if (date) params.append('date', date);
      if (status) params.append('status', status);
      if (patientId) params.append('patientId', patientId);

      const url = `${API_BASE_URL}/api/appointments?${params.toString()}`;
      const response = await axios.get<Appointment[]>(url, this.getAuthHeaders());
      return response.data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  // Alias for getAppointments to maintain backward compatibility
  async getAllAppointments(date?: string): Promise<Appointment[]> {
    return this.getAppointments(date);
  }

  // Get a single appointment by ID
  async getAppointment(id: number): Promise<Appointment> {
    try {
      const response = await axios.get<Appointment>(
        `${API_BASE_URL}/api/appointments/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching appointment ${id}:`, error);
      throw error;
    }
  }

  // Create a new appointment
  async createAppointment(data: CreateAppointmentRequest): Promise<Appointment> {
    try {
      // Remove dentistId and endTime if they exist in the data object
      const { ...cleanData } = data as any;
      delete cleanData.dentistId;
      delete cleanData.endTime;
      
      const response = await axios.post<Appointment>(
        `${API_BASE_URL}/api/appointments`,
        cleanData,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  // Update an existing appointment
  async updateAppointment(
    id: number,
    data: UpdateAppointmentRequest
  ): Promise<Appointment> {
    try {
      // Remove dentistId and endTime if they exist in the data object
      const { ...cleanData } = data as any;
      delete cleanData.dentistId;
      delete cleanData.endTime;
      
      const response = await axios.put<Appointment>(
        `${API_BASE_URL}/api/appointments/${id}`,
        cleanData,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating appointment ${id}:`, error);
      throw error;
    }
  }

  // Delete an appointment
  async deleteAppointment(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/appointments/${id}`,
        this.getAuthHeaders()
      );
    } catch (error) {
      console.error(`Error deleting appointment ${id}:`, error);
      throw error;
    }
  }
}

export default new AppointmentService();