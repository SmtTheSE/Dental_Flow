import React from 'react';
import { Phone, Mail, Calendar, AlertTriangle, CheckCircle, Clock, User } from 'lucide-react';

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

interface PatientCardProps {
  patient: Patient;
  onSelect: () => void;
}

const PatientCard: React.FC<PatientCardProps> = ({ patient, onSelect }) => {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div 
      onClick={onSelect}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-gray-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
              {patient.name}
            </h3>
            <p className="text-sm text-gray-500">Age {patient.age}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getRiskColor(patient.riskLevel)}`}>
          {patient.riskLevel} risk
        </span>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Phone className="w-4 h-4" />
          <span>{patient.phone}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Mail className="w-4 h-4" />
          <span>{patient.email}</span>
        </div>
      </div>

      {/* Treatment Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(patient.treatmentStatus)}
          <span className="text-sm font-medium text-gray-700 capitalize">
            {patient.treatmentStatus} Treatment
          </span>
        </div>
        <span className="text-xs text-gray-500">{patient.insuranceProvider}</span>
      </div>

      {/* Appointments */}
      <div className="border-t border-gray-100 pt-4">
        <div className="flex justify-between text-sm">
          <div>
            <p className="text-gray-500">Last Visit</p>
            <p className="font-medium text-gray-900">
              {new Date(patient.lastVisit).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Next Appointment</p>
            <p className="font-medium text-gray-900">
              {patient.nextAppointment 
                ? new Date(patient.nextAppointment).toLocaleDateString()
                : 'Not scheduled'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;