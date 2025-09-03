// src/components/patients/PatientCard.tsx
import React, { useState } from 'react';
import { Phone, Mail, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../services/patientService';
import ConfirmationModal from './ConfirmationModal';

interface PatientCardProps {
  patient: Patient;
  onSelect: () => void;
  onDelete: (id: number) => void;
  onUpdate: (patient: Patient) => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onSelect, onDelete, onUpdate }) => {
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (risk: string) => {
    switch (risk) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
  };

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

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    onDelete(patient.id);
  };

  const handleUpdate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowUpdateModal(true);
  };

  const handleConfirmUpdate = () => {
    onUpdate(patient);
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    navigate(`/patients/${patient.id}`);
  };

  return (
    <>
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer group flex flex-col h-full"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-lg truncate">
                {patient.firstName} {patient.lastName}
              </h3>
              <p className="text-sm text-gray-500">Age {calculateAge(patient.dateOfBirth)}</p>
            </div>
          </div>
          <div className="flex space-x-1 ml-2">
            <button 
              onClick={handleUpdate}
              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
              title="Update patient"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            <button 
              onClick={handleDelete}
              className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
              title="Delete patient"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Risk badge - moved to below header for better alignment */}
        <div className="flex justify-end mb-4">
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getRiskColor(patient.riskLevel)}`}>
            {patient.riskLevel} risk
          </span>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4 flex-grow">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Phone className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{patient.phone || 'No phone provided'}</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Mail className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{patient.email || 'No email provided'}</span>
          </div>
        </div>

        {/* Insurance Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {getStatusIcon(patient.riskLevel)}
            <span className="text-sm font-medium text-gray-700 capitalize">
              {patient.riskLevel} Risk
            </span>
          </div>
          <span className="text-xs text-gray-500 truncate max-w-[100px]" title={patient.insuranceProvider || 'No insurance'}>
            {patient.insuranceProvider || 'No insurance'}
          </span>
        </div>

        {/* Patient Info */}
        <div className="border-t border-gray-100 pt-4 mt-auto">
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-gray-500 text-xs">Date of Birth</p>
              <p className="font-medium text-gray-900">
                {formatDate(patient.dateOfBirth)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-xs">Member since</p>
              <p className="font-medium text-gray-900">
                {formatDate(patient.createdAt || patient.dateOfBirth)}
              </p>
            </div>
          </div>
        </div>
        
        {/* View Details Button */}
        <div className="mt-4">
          <button 
            onClick={handleViewDetails}
            className="w-full py-2 text-center text-blue-600 hover:text-blue-800 text-sm font-medium rounded-lg border border-blue-200 hover:border-blue-300 transition-colors duration-200"
          >
            View Details
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Patient"
        message="This patient data will be permanently deleted. Are you sure you want to continue?"
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Update Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={handleConfirmUpdate}
        title="Update Patient"
        message="Are you sure you want to update this patient's information?"
        confirmText="Update"
        cancelText="Cancel"
      />
    </>
  );
};

export default PatientCard;