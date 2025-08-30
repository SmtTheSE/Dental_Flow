import React from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const TreatmentHistory: React.FC = () => {
  const treatments = [
    {
      id: 1,
      date: '2024-12-28',
      procedure: 'Routine Cleaning & Examination',
      tooth: 'Full mouth',
      provider: 'Dr. Sarah Johnson',
      status: 'completed',
      notes: 'Excellent oral hygiene. No cavities detected. Continue regular cleanings.',
      cost: '$125.00'
    },
    {
      id: 2,
      date: '2024-09-15',
      procedure: 'Composite Filling',
      tooth: '#3 (Upper right molar)',
      provider: 'Dr. Sarah Johnson',
      status: 'completed',
      notes: 'Small cavity filled with composite material. Patient tolerated procedure well.',
      cost: '$285.00'
    },
    {
      id: 3,
      date: '2024-06-10',
      procedure: 'Digital X-Rays',
      tooth: 'Full mouth',
      provider: 'Dr. Sarah Johnson',
      status: 'completed',
      notes: 'Routine annual X-rays. No significant changes from previous year.',
      cost: '$95.00'
    },
    {
      id: 4,
      date: '2025-01-15',
      procedure: 'Crown Preparation',
      tooth: '#7 (Upper right premolar)',
      provider: 'Dr. Sarah Johnson',
      status: 'scheduled',
      notes: 'Pre-treatment planning completed. Patient education provided.',
      cost: '$850.00'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'scheduled': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Treatment History</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Export Record
        </button>
      </div>

      <div className="space-y-4">
        {treatments.map((treatment) => (
          <div 
            key={treatment.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3">
                {getStatusIcon(treatment.status)}
                <div>
                  <h4 className="font-medium text-gray-900">{treatment.procedure}</h4>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(treatment.date).toLocaleDateString()}</span>
                    </div>
                    <span>•</span>
                    <span>{treatment.tooth}</span>
                    <span>•</span>
                    <span>{treatment.provider}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  treatment.status === 'completed' ? 'bg-green-100 text-green-800' :
                  treatment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {treatment.status.charAt(0).toUpperCase() + treatment.status.slice(1)}
                </span>
                <p className="text-sm font-medium text-gray-900 mt-1">{treatment.cost}</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-700">{treatment.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TreatmentHistory;