// src/services/dashboardService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface DashboardStats {
  todayAppointments: number;
  activePatients: number;
  pendingTreatments: number;
  monthlyRevenue: number;
}

export interface PatientStats {
  totalPatients: number;
  lowRiskPatients: number;
  mediumRiskPatients: number;
  highRiskPatients: number;
}

class DashboardService {
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

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await axios.get<DashboardStats>(
        `${API_BASE_URL}/api/dashboard/stats`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  // Get patient statistics
  async getPatientStats(): Promise<PatientStats> {
    try {
      const response = await axios.get<PatientStats>(
        `${API_BASE_URL}/api/patients/stats`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      throw error;
    }
  }
}

export default new DashboardService();