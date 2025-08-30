// src/components/patients/PatientCard.tsx
import React from 'react';
import { Phone, Mail, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Patient } from '../../services/patientService';

interface PatientCardProps {
  patient: Patient;
  onSelect: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onSelect }) => {
  const navigate = useNavigate();

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
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

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    navigate(`/patient/${patient.id}`);
  };

  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-300 cursor-pointer group flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-lg">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-gray-500">Age {calculateAge(patient.dateOfBirth)}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRiskColor(patient.riskLevel)}`}>
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
  );
};

export default PatientCard;