import React from 'react';
import { Calendar, DollarSign, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';

interface TreatmentPlanData {
  id: number;
  patient: string;
  title: string;
  procedures: string[];
  status: 'in-progress' | 'pending-approval' | 'planning' | 'completed';
  startDate: string;
  estimatedCompletion: string;
  totalCost: number;
  insuranceCovered: number;
}

interface TreatmentPlanProps {
  plan: TreatmentPlanData;
}

const TreatmentPlan: React.FC<TreatmentPlanProps> = ({ plan }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending-approval': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'planning': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const patientOutOfPocket = plan.totalCost - plan.insuranceCovered;
  const coveragePercentage = Math.round((plan.insuranceCovered / plan.totalCost) * 100);

  return (
    <div className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
          <p className="text-gray-600">Patient: {plan.patient}</p>
          <div className="flex items-center space-x-2 mt-2">
            {getStatusIcon(plan.status)}
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(plan.status)}`}>
              {plan.status.replace('-', ' ').toUpperCase()}
            </span>
          </div>
        </div>
        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 border border-blue-200 hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors">
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
      </div>

      {/* Procedures */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Procedures ({plan.procedures.length})</h4>
        <div className="flex flex-wrap gap-2">
          {plan.procedures.map((procedure, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
            >
              {procedure}
            </span>
          ))}
        </div>
      </div>

      {/* Timeline and Cost */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
            <Calendar className="w-4 h-4" />
            <span>Start Date</span>
          </div>
          <p className="font-medium text-gray-900">
            {new Date(plan.startDate).toLocaleDateString()}
          </p>
        </div>
        
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
            <Clock className="w-4 h-4" />
            <span>Completion</span>
          </div>
          <p className="font-medium text-gray-900">
            {new Date(plan.estimatedCompletion).toLocaleDateString()}
          </p>
        </div>
        
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Total Cost</span>
          </div>
          <p className="font-medium text-gray-900">${plan.totalCost.toLocaleString()}</p>
          <p className="text-xs text-green-600">{coveragePercentage}% covered</p>
        </div>
        
        <div>
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-1">
            <DollarSign className="w-4 h-4" />
            <span>Patient Pays</span>
          </div>
          <p className="font-medium text-gray-900">${patientOutOfPocket.toLocaleString()}</p>
          <p className="text-xs text-gray-500">Out of pocket</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Treatment Progress</span>
          <span>
            {plan.status === 'completed' ? '100%' : 
             plan.status === 'in-progress' ? '45%' : '0%'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ${
              plan.status === 'completed' ? 'bg-green-500 w-full' :
              plan.status === 'in-progress' ? 'bg-blue-500 w-5/12' :
              'bg-gray-400 w-0'
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlan;