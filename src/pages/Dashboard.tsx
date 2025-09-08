import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, DollarSign, FileText } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import AppointmentsList from '../components/dashboard/AppointmentsList';
import TreatmentQueue from '../components/dashboard/TreatmentQueue';
import { useAuth } from '../context/AuthContext';
import dashboardService, { DashboardStats } from '../services/dashboardService';
import billingService, { Invoice } from '../services/billingService';
import patientService, { Patient } from '../services/patientService';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [criticalPatients, setCriticalPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardStats, allInvoices, highRiskPatients] = await Promise.all([
          dashboardService.getDashboardStats(),
          billingService.getAllInvoices(),
          patientService.getAllPatients() // Get all patients first
        ]);
        setStats(dashboardStats);
        
        // Sort invoices by due date and take only the first 5 for display
        const sortedInvoices = [...allInvoices]
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
          .slice(0, 5);
        setInvoices(sortedInvoices);
        
        // Filter for high-risk patients and take only the first 3 for display
        const highRisk = highRiskPatients.filter(patient => patient.riskLevel === 'high');
        setCriticalPatients(highRisk.slice(0, 3));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = stats ? [
    {
      title: 'Active Patients',
      value: stats.activePatients.toString(),
      change: '',
      icon: Users,
      trend: 'up',
      color: 'green'
    }
  ] : [];

  // Determine how to address the user based on their role
  const getUserTitle = () => {
    if (!user) return 'Dr.';
    
    switch (user.role.toLowerCase()) {
      case 'dentist':
        return 'Dr.';
      case 'hygienist':
        return 'Hygienist';
      case 'admin':
        return 'Admin';
      default:
        return '';
    }
  };

  const userTitle = getUserTitle();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome, {user ? `${user.role.toLowerCase() === 'dentist' ? 'Dr. ' : ''}${user.firstName} ${user.lastName}` : 'Dr. Sitt Min Thar'}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Today</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        {statCards.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <AppointmentsList />
          <TreatmentQueue />
        </div>

        {/* Right Column - Alerts & Billing */}
        <div className="space-y-6">
          {/* Quick Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Alerts</h3>
            <div className="space-y-3">
              {criticalPatients.length > 0 ? (
                criticalPatients.map((patient) => (
                  <div key={patient.id} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-800">High-Risk Patient</p>
                      <p className="text-xs text-red-600">{patient.firstName} {patient.lastName} - Requires immediate attention</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm font-medium text-green-800">All Clear</p>
                    <p className="text-xs text-green-600">No critical patients at this time</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Billing Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Billing</h3>
                <button 
                  onClick={() => navigate('/billing')}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {invoices.length > 0 ? (
                <div className="space-y-4">
                  {invoices.map((invoice) => (
                    <div 
                      key={invoice.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
                      onClick={() => navigate('/billing')}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                          <FileText className="w-5 h-5 text-gray-500" />
                        </div>
                        
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{invoice.patientName}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(invoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          ${invoice.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Showing {invoices.length} of {invoices.length} invoices
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">0 invoices found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;