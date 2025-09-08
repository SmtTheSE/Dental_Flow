import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Calendar } from 'lucide-react';
import treatmentService, { PatientTreatment } from '../../services/treatmentService';
import { useNavigate } from 'react-router-dom';

const TreatmentQueue: React.FC = () => {
  const [treatments, setTreatments] = useState<PatientTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        setLoading(true);
        const data = await treatmentService.getAllPatientTreatments();
        // Filter to show only pending and in-progress treatments
        const filteredTreatments = data.filter(t => 
          t.status === 'pending' || t.status === 'in-progress'
        );
        setTreatments(filteredTreatments);
      } catch (err) {
        console.error('Error fetching treatments:', err);
        setError('Failed to load treatments');
      } finally {
        setLoading(false);
      }
    };

    fetchTreatments();
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'planning': return <AlertCircle className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Treatment Queue</h3>
          <p className="text-sm text-gray-600 mt-1">Upcoming treatments requiring attention</p>
        </div>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Treatment Queue</h3>
          <p className="text-sm text-gray-600 mt-1">Upcoming treatments requiring attention</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Treatment Queue</h3>
        <p className="text-sm text-gray-600 mt-1">Upcoming treatments requiring attention</p>
      </div>
      
      <div className="p-6">
        {treatments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No treatments in queue</p>
          </div>
        ) : (
          <div className="space-y-4">
            {treatments.map((treatment) => (
              <div 
                key={treatment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => navigate('/treatment-planning')}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                    {getStatusIcon(treatment.status)}
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="font-medium text-gray-900">{treatment.patientName}</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(treatment.priority)}`}>
                        {treatment.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{treatment.treatmentName}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(treatment.startDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Scheduled</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button 
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/treatment-planning');
                  }}
                >
                  Review Plan
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TreatmentQueue;