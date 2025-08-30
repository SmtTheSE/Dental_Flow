import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';

const AppointmentCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock appointment data
  const appointments = [
    { id: 1, time: '09:00', patient: 'Emma Wilson', type: 'Cleaning', duration: 45 },
    { id: 2, time: '10:00', patient: 'Michael Brown', type: 'Root Canal', duration: 90 },
    { id: 3, time: '11:30', patient: 'Sarah Davis', type: 'Crown Fitting', duration: 60 },
    { id: 4, time: '14:00', patient: 'David Miller', type: 'Emergency', duration: 30 },
    { id: 5, time: '15:00', patient: 'Lisa Chen', type: 'Consultation', duration: 45 },
    { id: 6, time: '16:00', patient: 'Robert Taylor', type: 'Filling', duration: 30 }
  ];

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30', '18:00'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  const getAppointmentForTime = (time: string) => {
    return appointments.find(apt => apt.time === time);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentDate.toLocaleDateString('en-US', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => navigateMonth('prev')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <button 
                onClick={() => navigateMonth('next')}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Today: {new Date().toLocaleDateString()}
          </button>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Today's Schedule</h4>
        <div className="space-y-2">
          {timeSlots.map((time) => {
            const appointment = getAppointmentForTime(time);
            return (
              <div key={time} className="flex items-center space-x-4 py-2">
                <div className="w-16 text-sm text-gray-600 font-medium">{time}</div>
                {appointment ? (
                  <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.patient}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span>{appointment.type}</span>
                            <span>•</span>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{appointment.duration} min</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button className="text-sm text-blue-600 hover:text-blue-700">
                        View Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer">
                    <p className="text-sm text-gray-400 text-center">Available</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;