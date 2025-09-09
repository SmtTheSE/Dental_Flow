// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Appointments from './pages/Appointments';
import TreatmentPlanning from './pages/TreatmentPlanning';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import ToothAnalysis from './pages/ToothAnalysis';
import { Patient } from './services/patientService';

// Main App Layout Component
const AppLayout: React.FC = () => { 
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Update currentPage based on current route
  React.useEffect(() => {
    const pathToPageMap: Record<string, string> = {
      '/': 'dashboard',
      '/patients': 'patients',
      '/appointments': 'appointments',
      '/treatment-planning': 'treatment-planning',
      '/tooth-analysis': 'tooth-analysis',
      '/billing': 'billing',
      '/analytics': 'analytics'
    };
    
    // Check if the current path starts with /patients/ (for patient detail pages)
    let page;
    if (location.pathname.startsWith('/patients/')) {
      // For patient detail pages, keep the 'patients' menu item active
      page = 'patients';
    } else {
      page = pathToPageMap[location.pathname] || 'dashboard';
    }
    
    setCurrentPage(page);
  }, [location.pathname]);

  // Don't show sidebar and header on auth pages
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="flex h-screen bg-gray-50">
      {!isAuthPage && <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isAuthPage && <Header />}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/patients" element={<ProtectedRoute><Patients setSelectedPatient={setSelectedPatient} /></ProtectedRoute>} />
            <Route path="/patients/:id" element={<ProtectedRoute><PatientDetail /></ProtectedRoute>} />
            <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
            <Route path="/treatment-planning" element={<ProtectedRoute><TreatmentPlanning selectedPatient={selectedPatient} /></ProtectedRoute>} />
            <Route path="/tooth-analysis" element={<ProtectedRoute><ToothAnalysis /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Router>
          <AppLayout />
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
};

export default App;