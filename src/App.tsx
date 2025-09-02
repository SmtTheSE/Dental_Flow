// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

// Main App Layout Component
const AppLayout: React.FC = () => { 
  const location = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Determine the current page based on the location
  const getCurrentPage = () => {
    switch (location.pathname) {
      case '/patients':
        return 'patients';
      case '/appointments':
        return 'appointments';
      case '/treatment-planning':
        return 'treatment-planning';
      case '/billing':
        return 'billing';
      case '/analytics':
        return 'analytics';
      default:
        return 'dashboard';
    }
  };

  const [currentPage, setCurrentPage] = useState(getCurrentPage());

  // Update currentPage when location changes
  React.useEffect(() => {
    setCurrentPage(getCurrentPage());
  }, [location]);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients" element={<Patients setSelectedPatient={setSelectedPatient} />} />
            <Route path="/patient/:id" element={<PatientDetail patient={selectedPatient} />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/treatment-planning" element={<TreatmentPlanning selectedPatient={selectedPatient} />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;