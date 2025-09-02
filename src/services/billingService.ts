// src/services/billingService.ts
import axios from 'axios';
import { Patient } from './patientService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface Invoice {
  id: number;
  patientId: number;
  patientName: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  issuedDate: string;
  paymentMethod: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceRequest {
  patientId: number;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
  dueDate: string;
  issuedDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface BillingStats {
  monthlyRevenue: number;
  pendingPayments: number;
  insuranceClaims: number;
  collections: number;
}

class BillingService {
  private getAuthHeaders() {
    const token = localStorage.getItem('dental_token');
    
    // Log for debugging purposes
    if (!token) {
      console.warn('No authentication token found in localStorage');
    }
    
    return {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  async getBillingStats(): Promise<BillingStats> {
    try {
      const response = await axios.get<BillingStats>(
        `${API_BASE_URL}/api/billing/stats`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching billing stats:', error.response || error);
      throw error;
    }
  }

  async getAllInvoices(status?: string, patientId?: number): Promise<Invoice[]> {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (patientId) params.append('patientId', patientId.toString());

      const url = `${API_BASE_URL}/api/billing/invoices${params.toString() ? `?${params.toString()}` : ''}`;
      
      const response = await axios.get<Invoice[]>(
        url,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error fetching invoices:', error.response || error);
      throw error;
    }
  }

  async getInvoiceById(id: number): Promise<Invoice> {
    try {
      const response = await axios.get<Invoice>(
        `${API_BASE_URL}/api/billing/invoices/${id}`,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error fetching invoice with ID ${id}:`, error.response || error);
      throw error;
    }
  }

  async createInvoice(invoice: CreateInvoiceRequest): Promise<Invoice> {
    try {
      // Convert camelCase to snake_case for backend compatibility
      const invoiceData = {
        patient_id: invoice.patientId,
        amount: invoice.amount,
        status: invoice.status,
        due_date: invoice.dueDate,
        issued_date: invoice.issuedDate,
        payment_method: invoice.paymentMethod,
        notes: invoice.notes
      };

      const response = await axios.post<Invoice>(
        `${API_BASE_URL}/api/billing/invoices`,
        invoiceData,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error('Error creating invoice:', error.response || error);
      throw error;
    }
  }

  async updateInvoice(id: number, invoice: Partial<CreateInvoiceRequest>): Promise<Invoice> {
    try {
      // Convert camelCase to snake_case for backend compatibility
      const invoiceData: any = {};
      if (invoice.patientId !== undefined) invoiceData.patient_id = invoice.patientId;
      if (invoice.amount !== undefined) invoiceData.amount = invoice.amount;
      if (invoice.status !== undefined) invoiceData.status = invoice.status;
      if (invoice.dueDate !== undefined) invoiceData.due_date = invoice.dueDate;
      if (invoice.issuedDate !== undefined) invoiceData.issued_date = invoice.issuedDate;
      if (invoice.paymentMethod !== undefined) invoiceData.payment_method = invoice.paymentMethod;
      if (invoice.notes !== undefined) invoiceData.notes = invoice.notes;

      const response = await axios.put<Invoice>(
        `${API_BASE_URL}/api/billing/invoices/${id}`,
        invoiceData,
        this.getAuthHeaders()
      );
      return response.data;
    } catch (error: any) {
      console.error(`Error updating invoice with ID ${id}:`, error.response || error);
      throw error;
    }
  }

  async deleteInvoice(id: number): Promise<void> {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/billing/invoices/${id}`,
        this.getAuthHeaders()
      );
    } catch (error: any) {
      console.error(`Error deleting invoice with ID ${id}:`, error.response || error);
      throw error;
    }
  }
}

export default new BillingService();