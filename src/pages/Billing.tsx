// src/pages/Billing.tsx
import React, { useState, useEffect } from 'react';
import { DollarSign, CreditCard, FileText, TrendingUp, Download, Plus, Clock, AlertTriangle, X } from 'lucide-react';
import billingService, { Invoice, BillingStats, CreateInvoiceRequest } from '../services/billingService';
import patientService, { Patient } from '../services/patientService';
import { useAuth } from '../context/AuthContext';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface Transaction {
  id: number;
  patient: string;
  amount: number;
  type: 'payment';
  method: string;
  date: string;
  status: 'pending' | 'paid' | 'overdue';
}

const Billing: React.FC = () => {
  const { isAuthenticated, token } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [billingData, setBillingData] = useState<BillingStats>({
    monthlyRevenue: 0,
    pendingPayments: 0,
    insuranceClaims: 0,
    collections: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Create invoice state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [createInvoiceLoading, setCreateInvoiceLoading] = useState(false);
  const [editInvoiceLoading, setEditInvoiceLoading] = useState(false);
  const [deleteInvoiceLoading, setDeleteInvoiceLoading] = useState(false);
  const [createInvoiceError, setCreateInvoiceError] = useState<string | null>(null);
  const [editInvoiceError, setEditInvoiceError] = useState<string | null>(null);
  const [deleteInvoiceError, setDeleteInvoiceError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    patientId: 0,
    amount: 0,
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    dueDate: '',
    issuedDate: '',
    paymentMethod: '',
    notes: ''
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    patientId: 0,
    amount: 0,
    status: 'pending' as 'pending' | 'paid' | 'overdue',
    dueDate: '',
    issuedDate: '',
    paymentMethod: '',
    notes: ''
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Payments' },
    { id: 'reports', label: 'Reports' }
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError('Please log in to access billing information.');
      return;
    }

    // Check if token exists
    if (!token) {
      setLoading(false);
      setError('Authentication token not found. Please log in again.');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch billing stats
        const stats = await billingService.getBillingStats();
        setBillingData(stats);
        
        // Fetch invoices
        const invoiceData = await billingService.getAllInvoices();
        setInvoices(invoiceData || []); // Ensure we always have an array
        
        // Convert invoices to transactions for display
        const transactionData: Transaction[] = (invoiceData || []).map(invoice => ({
          id: invoice.id,
          patient: invoice.patientName,
          amount: invoice.amount,
          type: 'payment' as const,
          method: invoice.paymentMethod || 'Not specified',
          date: invoice.createdAt,
          status: invoice.status as 'pending' | 'paid' | 'overdue'
        }));
        
        setRecentTransactions(transactionData);
      } catch (err: any) {
        console.error('Error loading billing data:', err);
        if (err.response && err.response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (err.response && err.response.status === 500) {
          setError('Server error. Please try again later or contact support.');
        } else {
          setError(err.message || 'Failed to load billing data. You can still create your first invoice.');
        }
        // Even if there's an error, ensure we have empty arrays to prevent UI crashes
        setInvoices([]);
        setRecentTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, token]);

  // Load patients when modal opens
  useEffect(() => {
    if (showCreateModal && patients.length === 0) {
      const loadPatients = async () => {
        try {
          setPatientLoading(true);
          const patientData = await patientService.getAllPatients();
          setPatients(patientData);
        } catch (err) {
          console.error('Error loading patients:', err);
        } finally {
          setPatientLoading(false);
        }
      };
      
      loadPatients();
    }
  }, [showCreateModal, patients.length]);

  const handleRetry = () => {
    // Reload data
    window.location.reload();
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEditFormData({
      patientId: invoice.patientId,
      amount: invoice.amount,
      status: invoice.status,
      dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
      issuedDate: invoice.issuedDate ? new Date(invoice.issuedDate).toISOString().split('T')[0] : '',
      paymentMethod: invoice.paymentMethod || '',
      notes: invoice.notes || ''
    });
    setShowEditModal(true);
  };

  const handleDeleteInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowDeleteModal(true);
  };

  const confirmDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    
    try {
      setDeleteInvoiceLoading(true);
      setDeleteInvoiceError(null);
      
      await billingService.deleteInvoice(selectedInvoice.id);
      
      // Remove deleted invoice from the list
      setInvoices(prev => prev.filter(invoice => invoice.id !== selectedInvoice.id));
      
      // Remove from recent transactions
      setRecentTransactions(prev => prev.filter(transaction => transaction.id !== selectedInvoice.id));
      
      setShowDeleteModal(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      console.error('Error deleting invoice:', err);
      setDeleteInvoiceError(err.message || 'Failed to delete invoice. Please try again.');
    } finally {
      setDeleteInvoiceLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.patientId === 0) {
      setCreateInvoiceError('Please select a patient');
      return;
    }
    
    if (formData.amount <= 0) {
      setCreateInvoiceError('Please enter a valid amount');
      return;
    }
    
    if (!formData.dueDate) {
      setCreateInvoiceError('Please select a due date');
      return;
    }
    
    try {
      setCreateInvoiceLoading(true);
      setCreateInvoiceError(null);
      
      const invoiceData: CreateInvoiceRequest = {
        patientId: formData.patientId,
        amount: formData.amount,
        status: formData.status,
        dueDate: formData.dueDate,
        issuedDate: formData.issuedDate, // Already in correct format
        paymentMethod: formData.paymentMethod,
        notes: formData.notes
      };
      
      const newInvoice = await billingService.createInvoice(invoiceData);
      
      // Add new invoice to the list
      setInvoices(prev => [newInvoice, ...prev]);
      
      // Convert to transaction and add to recent transactions
      const newTransaction: Transaction = {
        id: newInvoice.id,
        patient: newInvoice.patientName,
        amount: newInvoice.amount,
        type: 'payment' as const,
        method: newInvoice.paymentMethod || 'Not specified',
        date: newInvoice.createdAt,
        status: newInvoice.status as 'pending' | 'paid' | 'overdue'
      };
      
      setRecentTransactions(prev => [newTransaction, ...prev]);
      
      // Reset form and close modal
      setFormData({
        patientId: 0,
        amount: 0,
        status: 'pending',
        dueDate: '',
        issuedDate: '',
        paymentMethod: '',
        notes: ''
      });
      
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setCreateInvoiceError(err.message || 'Failed to create invoice. Please try again.');
    } finally {
      setCreateInvoiceLoading(false);
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedInvoice) return;
    
    if (editFormData.patientId === 0) {
      setEditInvoiceError('Please select a patient');
      return;
    }
    
    if (editFormData.amount <= 0) {
      setEditInvoiceError('Please enter a valid amount');
      return;
    }
    
    if (!editFormData.dueDate) {
      setEditInvoiceError('Please select a due date');
      return;
    }
    
    try {
      setEditInvoiceLoading(true);
      setEditInvoiceError(null);
      
      const invoiceData = {
        patientId: editFormData.patientId,
        amount: editFormData.amount,
        status: editFormData.status,
        dueDate: editFormData.dueDate, // Already in correct format
        issuedDate: editFormData.issuedDate, // Already in correct format
        paymentMethod: editFormData.paymentMethod,
        notes: editFormData.notes
      };
      
      const updatedInvoice = await billingService.updateInvoice(selectedInvoice.id, invoiceData);
      
      // Update invoice in the list
      setInvoices(prev => prev.map(invoice => 
        invoice.id === selectedInvoice.id ? updatedInvoice : invoice
      ));
      
      // Update in recent transactions
      setRecentTransactions(prev => prev.map(transaction => 
        transaction.id === selectedInvoice.id ? {
          ...transaction,
          patient: updatedInvoice.patientName,
          amount: updatedInvoice.amount,
          method: updatedInvoice.paymentMethod || 'Not specified',
          status: updatedInvoice.status as 'pending' | 'paid' | 'overdue'
        } : transaction
      ));
      
      setShowEditModal(false);
      setSelectedInvoice(null);
    } catch (err: any) {
      console.error('Error updating invoice:', err);
      setEditInvoiceError(err.message || 'Failed to update invoice. Please try again.');
    } finally {
      setEditInvoiceLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else if (name === 'patientId') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Export invoice as PDF
  const exportInvoiceAsPDF = (invoice: Invoice) => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Dental Clinic Invoice', 105, 20, { align: 'center' });
    
    // Add clinic information
    doc.setFontSize(12);
    doc.text('123 Dental Street', 105, 30, { align: 'center' });
    doc.text('City, State 12345', 105, 37, { align: 'center' });
    doc.text('Phone: (123) 456-7890', 105, 44, { align: 'center' });
    
    // Add horizontal line
    doc.line(20, 50, 190, 50);
    
    // Add invoice details
    doc.setFontSize(14);
    doc.text(`Invoice #${invoice.id}`, 20, 60);
    
    doc.setFontSize(12);
    doc.text(`Patient: ${invoice.patientName}`, 20, 70);
    doc.text(`Issue Date: ${invoice.issuedDate}`, 20, 77);
    doc.text(`Due Date: ${invoice.dueDate}`, 20, 84);
    doc.text(`Status: ${invoice.status}`, 20, 91);
    
    // Add payment details table
    try {
      (doc as any).autoTable({
        startY: 100,
        head: [['Description', 'Amount']],
        body: [
          ['Dental Services', `$${invoice.amount.toFixed(2)}`]
        ],
        styles: {
          fontSize: 10
        },
        headStyles: {
          fillColor: [22, 160, 133]
        }
      });
      
      // Add total using the lastAutoTable property
      const finalY = (doc as any).lastAutoTable.finalY;
      doc.text(`Total Amount: $${invoice.amount.toFixed(2)}`, 150, finalY + 15, { align: 'right' });
      
      // Add notes
      if (invoice.notes) {
        doc.text('Notes:', 20, finalY + 30);
        doc.text(invoice.notes, 20, finalY + 37, { maxWidth: 170 });
      }
    } catch (error) {
      // Fallback if autoTable fails
      console.error('Error generating table:', error);
      doc.text('Dental Services', 20, 100);
      doc.text(`$${invoice.amount.toFixed(2)}`, 150, 100, { align: 'right' });
      doc.text(`Total Amount: $${invoice.amount.toFixed(2)}`, 150, 115, { align: 'right' });
      
      // Add notes
      if (invoice.notes) {
        doc.text('Notes:', 20, 130);
        doc.text(invoice.notes, 20, 137, { maxWidth: 170 });
      }
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Page ${i} of ${pageCount}`, 105, 285, { align: 'center' });
    }
    
    // Save the PDF
    doc.save(`invoice-${invoice.id}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
            <div className="mt-4">
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage invoices, track payments, and view financial reports
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-teal-100">
              <DollarSign className="h-6 w-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Monthly Revenue</h3>
              <p className="text-2xl font-semibold text-gray-900">${billingData.monthlyRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Pending Payments</h3>
              <p className="text-2xl font-semibold text-gray-900">${billingData.pendingPayments.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Collections</h3>
              <p className="text-2xl font-semibold text-gray-900">${billingData.collections.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-600">Insurance Claims</h3>
              <p className="text-2xl font-semibold text-gray-900">${billingData.insuranceClaims.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Recent Transactions Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => {
                      const invoice = invoices.find(inv => inv.id === transaction.id);
                      return (
                        <tr key={transaction.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{transaction.patient}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">${transaction.amount.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(transaction.date).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${transaction.status === 'paid' ? 'bg-green-100 text-green-800' : 
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {invoice && (
                              <>
                                <button 
                                  onClick={() => handleEditInvoice(invoice)}
                                  className="flex items-center text-blue-600 hover:text-blue-900 mr-3"
                                >
                                  Edit
                                </button>
                                <button 
                                  onClick={() => exportInvoiceAsPDF(invoice)}
                                  className="flex items-center text-teal-600 hover:text-teal-900 mr-3"
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Export
                                </button>
                                <button 
                                  onClick={() => handleDeleteInvoice(invoice)}
                                  className="flex items-center text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        No transactions found. Create your first invoice!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Invoices Table */}
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">All Invoices</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">#{invoice.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{invoice.patientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">${invoice.amount.toFixed(2)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {invoice.issuedDate ? new Date(invoice.issuedDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button 
                            onClick={() => handleEditInvoice(invoice)}
                            className="flex items-center text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => exportInvoiceAsPDF(invoice)}
                            className="flex items-center text-teal-600 hover:text-teal-900 mr-3"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Export
                          </button>
                          <button 
                            onClick={() => handleDeleteInvoice(invoice)}
                            className="flex items-center text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No invoices found. Create your first invoice!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Processing</h3>
          <p className="text-gray-600">Payment processing functionality would be implemented here.</p>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Reports</h3>
          <p className="text-gray-600">Financial reporting functionality would be implemented here.</p>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Edit Invoice #{selectedInvoice.id}</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateInvoice}>
              <div className="px-6 py-4 space-y-4">
                {editInvoiceError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {editInvoiceError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="editPatientId" className="block text-sm font-medium text-gray-700">
                    Patient
                  </label>
                  <div className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 sm:text-sm">
                    {selectedInvoice?.patientName}
                  </div>
                  <input 
                    type="hidden" 
                    name="patientId" 
                    value={editFormData.patientId} 
                  />
                </div>
                
                <div>
                  <label htmlFor="editAmount" className="block text-sm font-medium text-gray-700">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    id="editAmount"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={editFormData.amount || ''}
                    onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value) || 0})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="editStatus"
                    name="status"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value as any})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="editIssuedDate" className="block text-sm font-medium text-gray-700">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    id="editIssuedDate"
                    name="issuedDate"
                    value={editFormData.issuedDate}
                    onChange={(e) => setEditFormData({...editFormData, issuedDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="editDueDate" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="editDueDate"
                    name="dueDate"
                    value={editFormData.dueDate}
                    onChange={(e) => setEditFormData({...editFormData, dueDate: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="editPaymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="editPaymentMethod"
                    name="paymentMethod"
                    value={editFormData.paymentMethod}
                    onChange={(e) => setEditFormData({...editFormData, paymentMethod: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="insurance">Insurance</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="editNotes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="editNotes"
                    name="notes"
                    rows={3}
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editInvoiceLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                >
                  {editInvoiceLoading ? 'Updating...' : 'Update Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Invoice Confirmation Modal */}
      {showDeleteModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Delete Invoice</h3>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="px-6 py-4">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
                <p className="text-sm font-medium text-gray-900">Are you sure?</p>
              </div>
              
              <p className="text-sm text-gray-500 mb-4">
                Are you sure you want to delete invoice #{selectedInvoice.id} for {selectedInvoice.patientName}? 
                This action cannot be undone.
              </p>
              
              {deleteInvoiceError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {deleteInvoiceError}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteInvoice}
                disabled={deleteInvoiceLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {deleteInvoiceLoading ? 'Deleting...' : 'Delete Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Create New Invoice</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateInvoice}>
              <div className="px-6 py-4 space-y-4">
                {createInvoiceError && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">
                          {createInvoiceError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="patientId" className="block text-sm font-medium text-gray-700">
                    Patient
                  </label>
                  <select
                    id="patientId"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  >
                    <option value="0">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="issuedDate" className="block text-sm font-medium text-gray-700">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    id="issuedDate"
                    name="issuedDate"
                    value={formData.issuedDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="insurance">Insurance</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    rows={3}
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm"
                  />
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoiceLoading}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                >
                  {createInvoiceLoading ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Billing;