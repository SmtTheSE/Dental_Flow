import React from 'react';
import { Clock, User, Phone, MapPin } from 'lucide-react';

const AppointmentsList: React.FC = () => {
  const appointments = [
    {
      id: 1,
      time: '9:00 AM',
      patient: 'Emma Wilson',
      type: 'Routine Cleaning',
      duration: '45 min',
      status: 'confirmed',
      phone: '(555) 123-4567'
    },
    {
      id: 2,
      time: '10:00 AM',
      patient: 'Michael Brown',
      type: 'Root Canal - Session 2',
      duration: '90 min',
      status: 'in-progress',
      phone: '(555) 987-6543'
    },
    {
      id: 3,
      time: '11:30 AM',
      patient: 'Sarah Davis',
      type: 'Crown Fitting',
      duration: '60 min',
      status: 'confirmed',
      phone: '(555) 456-7890'
    },
    {
      id: 4,
      time: '2:00 PM',
      patient: 'David Miller',
      type: 'Emergency Visit',
      duration: '30 min',
      status: 'urgent',
      phone: '(555) 321-0987'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Today's Appointments</h3>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all
          </button>
        </div>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div 
              key={appointment.id} 
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 cursor-pointer group"
            >
              <div className="flex items-center space-x-4">
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-semibold text-gray-900">{appointment.time}</p>
                  <p className="text-xs text-gray-500">{appointment.duration}</p>
                </div>
                
                <div className="w-px h-12 bg-gray-200"></div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <User className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900">{appointment.patient}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{appointment.type}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Phone className="w-3 h-3" />
                    <span>{appointment.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(appointment.status)}`}>
                  {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                </span>
                <button className="text-xs text-blue-600 hover:text-blue-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentsList;