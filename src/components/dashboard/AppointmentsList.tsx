import React, { useState, useEffect } from 'react';
import { Clock, User } from 'lucide-react';
import appointmentService, { Appointment } from '../../services/appointmentService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AppointmentsList: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        // For dentists, we want to show only their appointments
        // The backend already filters by dentist ID when a dentist is logged in
        const data = await appointmentService.getTodaysAppointments();
        // Limit to first 5 appointments for dashboard display
        setAppointments(data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching appointments:', err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format time from HH:MM:SS to HH:MM AM/PM
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
          <button 
            onClick={() => navigate('/appointments')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
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
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
          <button 
            onClick={() => navigate('/appointments')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
          <button 
            onClick={() => navigate('/appointments')}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </button>
        </div>
      </div>
      
      <div className="p-6">
        {appointments.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No appointments scheduled for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div 
                key={appointment.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => navigate('/appointments')}
              >
                <div className="flex items-center space-x-4">
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-semibold text-gray-900">{formatTime(appointment.startTime)}</p>
                    <p className="text-xs text-gray-500">Start Time</p>
                  </div>
                  
                  <div className="w-px h-12 bg-gray-200"></div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <User className="w-4 h-4 text-gray-400" />
                      <p className="font-medium text-gray-900">{appointment.patientName}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{appointment.notes}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </span>
                  <button 
                    className="text-xs text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/appointments');
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsList;