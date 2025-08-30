// src/services/authService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'dentist' | 'hygienist' | 'admin' | 'staff';
  phone?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/login`,
      credentials
    );
    return response.data;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${API_BASE_URL}/api/auth/register`,
      userData
    );
    return response.data;
  }

  getCurrentUser(): Promise<User> {
    const token = localStorage.getItem('dental_token');
    return axios.get<User>(`${API_BASE_URL}/api/auth/user`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then(response => response.data);
  }

  logout(): void {
    localStorage.removeItem('dental_token');
    localStorage.removeItem('dental_user');
  }

  setToken(token: string): void {
    localStorage.setItem('dental_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('dental_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export default new AuthService();