import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import DentalChart from '../components/patients/DentalChart';
import patientService, { Patient } from '../services/patientService';
import treatmentService, { PatientTreatment } from '../services/treatmentService';
import { Calendar as CalendarIcon, Clock, CheckCircle } from 'lucide-react';

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientTreatments, setPatientTreatments] = useState<PatientTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [treatmentsLoading, setTreatmentsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) {
        setError('No patient ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const patientData = await patientService.getPatientById(parseInt(id, 10));
        setPatient(patientData);
        setError(null);
      } catch (err) {
        console.error('Error fetching patient:', err);
        setError('Failed to load patient details');
      } finally {
        setLoading(false);
      }
    };

    fetchPatient();
  }, [id]);

  useEffect(() => {
    const fetchPatientTreatments = async () => {
      if (!id) return;

      try {
        setTreatmentsLoading(true);
        const treatmentsData = await treatmentService.getPatientTreatmentsByPatientId(parseInt(id, 10));
        setPatientTreatments(treatmentsData);
      } catch (err) {
        console.error('Error fetching patient treatments:', err);
      } finally {
        setTreatmentsLoading(false);
      }
    };

    if (activeTab === 'treatment-history' && id) {
      fetchPatientTreatments();
    }
  }, [activeTab, id]);

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    return age;
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'dental-chart', label: 'Dental Chart' },
    { id: 'treatment-history', label: 'Treatment History' },
    { id: 'medical-history', label: 'Medical History' }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => navigate('/patients')}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Patient not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/patients')}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Patients</span>
      </button>

      {/* Patient Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
              <p className="text-gray-600">Age {calculateAge(patient.dateOfBirth)} • Patient ID: #{patient.id.toString().padStart(4, '0')}</p>
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
          <p className="text-sm text-gray-500">Date of Birth</p>
          <p className="font-semibold text-gray-900">
            {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Member since</p>
          <p className="font-semibold text-gray-900">
            {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Insurance</p>
          <p className="font-semibold text-gray-900">{patient.insuranceProvider || 'Not provided'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Risk Level</p>
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            patient.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
            patient.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {patient.riskLevel?.toUpperCase() || 'N/A'}
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
                    <p className="text-gray-900">{patient.emergencyContact || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date of Birth</label>
                    <p className="text-gray-900">
                      {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="text-gray-900">{patient.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700">{patient.medicalHistory || 'No medical history recorded'}</p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'dental-chart' && <DentalChart />}
          {activeTab === 'treatment-history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Treatment History</h3>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Export Record
                </button>
              </div>

              {treatmentsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : patientTreatments.length > 0 ? (
                <div className="space-y-4">
                  {patientTreatments.map((treatment) => (
                    <div 
                      key={treatment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start space-x-3">
                          {getStatusIcon(treatment.status)}
                          <div>
                            <h4 className="font-medium text-gray-900">{treatment.treatmentName}</h4>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <CalendarIcon className="w-4 h-4" />
                                <span>{treatment.startDate ? new Date(treatment.startDate).toLocaleDateString() : 'N/A'}</span>
                              </div>
                              <span>•</span>
                              <span>{treatment.dentistName || 'Not assigned'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            treatment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            treatment.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            treatment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1)}
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-sm text-gray-700">{treatment.notes || 'No notes provided'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No treatment history found for this patient</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'medical-history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Medical History</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                {patient.medicalHistory ? (
                  <p className="text-gray-700 whitespace-pre-line">{patient.medicalHistory}</p>
                ) : (
                  <p className="text-gray-500">No medical history recorded for this patient</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;