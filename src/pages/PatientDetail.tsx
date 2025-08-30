import React, { useState } from 'react';
import { ArrowLeft, Phone, Mail, Calendar, FileText, Pill, CreditCard } from 'lucide-react';
import DentalChart from '../components/patients/DentalChart';
import TreatmentHistory from '../components/patients/TreatmentHistory';
import MedicalHistory from '../components/patients/MedicalHistory';

interface Patient {
  id: number;
  name: string;
  age: number;
  phone: string;
  email: string;
  lastVisit: string;
  nextAppointment: string | null;
  treatmentStatus: 'active' | 'completed' | 'pending';
  riskLevel: 'low' | 'medium' | 'high';
  insuranceProvider: string;
}

interface PatientDetailProps {
  patient: Patient | null;
}

const PatientDetail: React.FC<PatientDetailProps> = ({ patient }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Select a patient to view details</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dental-chart', label: 'Dental Chart' },
    { id: 'treatment-history', label: 'Treatment History' },
    { id: 'medical-history', label: 'Medical History' },
    { id: 'billing', label: 'Billing' }
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Patients</span>
      </button>

      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {patient.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-600">Age {patient.age} • Patient ID: #{patient.id.toString().padStart(4, '0')}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{patient.phone}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{patient.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 lg:mt-0 flex flex-col space-y-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Schedule Appointment
            </button>
            <button className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Send Message
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Last Visit</p>
          <p className="font-semibold text-gray-900">{new Date(patient.lastVisit).toLocaleDateString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Next Appointment</p>
          <p className="font-semibold text-gray-900">
            {patient.nextAppointment 
              ? new Date(patient.nextAppointment).toLocaleDateString()
              : 'Not scheduled'
            }
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Insurance</p>
          <p className="font-semibold text-gray-900">{patient.insuranceProvider}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Risk Level</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            patient.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
            patient.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {patient.riskLevel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Emergency Contact</label>
                    <p className="text-gray-900">Jane Wilson (Sister) - (555) 987-1234</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">March 15, 1990</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">123 Main Street, City, State 12345</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Treatment</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900">Routine Cleaning & Examination</h4>
                  <p className="text-sm text-blue-700 mt-1">Scheduled for January 15, 2025</p>
                  <div className="mt-3">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-3/4"></div>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">75% Complete</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'dental-chart' && <DentalChart />}
          {activeTab === 'treatment-history' && <TreatmentHistory />}
          {activeTab === 'medical-history' && <MedicalHistory />}
          {activeTab === 'billing' && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Billing information will be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;