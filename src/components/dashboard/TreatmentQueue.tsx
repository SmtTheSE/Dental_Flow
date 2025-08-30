import React from 'react';
import { Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';

const TreatmentQueue: React.FC = () => {
  const treatments = [
    {
      id: 1,
      patient: 'Alice Johnson',
      procedure: 'Wisdom Tooth Extraction',
      priority: 'high',
      scheduledDate: '2025-01-15',
      estimatedDuration: '45 min',
      status: 'pending'
    },
    {
      id: 2,
      patient: 'Robert Chen',
      procedure: 'Dental Implant Consultation',
      priority: 'medium',
      scheduledDate: '2025-01-16',
      estimatedDuration: '60 min',
      status: 'approved'
    },
    {
      id: 3,
      patient: 'Maria Rodriguez',
      procedure: 'Orthodontic Assessment',
      priority: 'low',
      scheduledDate: '2025-01-18',
      estimatedDuration: '30 min',
      status: 'planning'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'planning': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Treatment Queue</h3>
        <p className="text-sm text-gray-600 mt-1">Upcoming treatments requiring attention</p>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {treatments.map((treatment) => (
            <div 
              key={treatment.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                  {getStatusIcon(treatment.status)}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="font-medium text-gray-900">{treatment.patient}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(treatment.priority)}`}>
                      {treatment.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{treatment.procedure}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(treatment.scheduledDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{treatment.estimatedDuration}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                Review Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TreatmentQueue;