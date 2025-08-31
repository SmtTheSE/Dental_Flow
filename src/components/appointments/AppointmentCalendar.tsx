import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
import appointmentService from '../../services/appointmentService';

interface Appointment {
  id: number;
  patientId: number;
  patientName: string;
  appointmentDate: string; // YYYY-MM-DD format
  startTime: string; // HH:MM format
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes: string;
  createdAt?: string;
  updatedAt?: string;
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to extract date from ISO string
const extractDateFromISO = (isoString: string): string => {
  // Extract just the date part from "2025-08-31T00:00:00Z" -> "2025-08-31"
  return isoString.split('T')[0];
};

// Helper function to extract time from ISO string
const extractTimeFromISO = (isoString: string): string => {
  // Extract time from "0000-01-01T09:00:00Z" -> "09:00"
  if (isoString.includes('T')) {
    return isoString.split('T')[1].split('Z')[0].substring(0, 5);
  }
  return isoString;
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

interface AppointmentCalendarProps {
  key?: number;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all appointments
  useEffect(() => {
    const fetchAllAppointments = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('dental_token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const data = await appointmentService.getAppointments();
        
        if (data && Array.isArray(data)) {
          setAllAppointments(data);
        } else {
          setAllAppointments([]);
        }
        
      } catch (err: any) {
        console.error('Error loading appointments:', err);
        setError(err.message || 'Failed to load appointments');
        setAllAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllAppointments();
  }, [currentDate]);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const formattedDate = formatDate(date);
    return allAppointments.filter(appt => {
      const appointmentDate = extractDateFromISO(appt.appointmentDate);
      return appointmentDate === formattedDate;
    });
  };

  // Format time for display
  const formatTime = (time: string) => {
    if (!time) return 'No time';
    
    const timeStr = extractTimeFromISO(time);
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get the first day of the month
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  };

  // Get the last day of the month
  const getLastDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  };

  // Get the day of week for the first day of the month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfWeek = (date: Date) => {
    return getFirstDayOfMonth(date).getDay();
  };

  // Get the number of days in the month
  const getDaysInMonth = (date: Date) => {
    return getLastDayOfMonth(date).getDate();
  };

  // Generate the calendar days
  const generateCalendarDays = () => {
    const days = [];
    const firstDayOfWeek = getFirstDayOfWeek(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
    }

    return days;
  };

  // Navigate to the previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to the next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Format the month and year for display
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Render the calendar header
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4">
      <button
        onClick={prevMonth}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <h2 className="text-xl font-semibold text-gray-800">
        {formatMonthYear(currentDate)}
      </h2>
      <button
        onClick={nextMonth}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Next month"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  // Render the day names
  const renderDayNames = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return (
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>
    );
  };

  // Render the calendar days
  const renderDays = () => {
    const days = generateCalendarDays();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (!day) {
            return <div key={index} className="h-24 border border-gray-100"></div>;
          }

          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, today);
          
          // Get appointments for this specific day
          const dayAppointments = getAppointmentsForDate(day);

          return (
            <div
              key={index}
              onClick={() => setSelectedDate(day)}
              className={`h-24 border border-gray-100 p-1 cursor-pointer transition-colors ${
                isSelected 
                  ? 'bg-blue-50 border-blue-300' 
                  : 'hover:bg-gray-50'
              } ${isToday ? 'bg-blue-100' : ''}`}
            >
              <div className={`text-sm font-medium ${
                isToday ? 'text-blue-700' : 'text-gray-700'
              }`}>
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1 max-h-16 overflow-y-auto">
                {dayAppointments.slice(0, 3).map((appt) => (
                  <div 
                    key={appt.id} 
                    className="text-xs bg-white p-1 rounded border truncate"
                    title={`${appt.patientName} - ${formatTime(appt.startTime)}`}
                  >
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1 text-gray-500" />
                      <span className="truncate">{appt.patientName}</span>
                    </div>
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      <span>{formatTime(appt.startTime)}</span>
                    </div>
                  </div>
                ))}
                {dayAppointments.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayAppointments.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render the selected date appointments
  const renderSelectedDateAppointments = () => {
    const selectedDateAppointments = getAppointmentsForDate(selectedDate);

    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Loading appointments...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-red-600 underline text-sm"
          >
            Refresh page
          </button>
        </div>
      );
    }

    if (selectedDateAppointments.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No appointments scheduled for this date.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">
          Appointments for {selectedDate.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h3>
        
        {selectedDateAppointments
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((appointment) => (
          <div key={appointment.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{appointment.patientName}</h4>
                <div className="flex items-center mt-1 text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatTime(appointment.startTime)}</span>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                appointment.status === 'scheduled' 
                  ? 'bg-blue-100 text-blue-800' 
                  : appointment.status === 'completed' 
                  ? 'bg-green-100 text-green-800' 
                  : appointment.status === 'cancelled' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {appointment.status}
              </span>
            </div>
            {appointment.notes && (
              <p className="mt-2 text-sm text-gray-600">{appointment.notes}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        {renderHeader()}
        {renderDayNames()}
        {renderDays()}
      </div>
      <div className="border-t pt-6">
        {renderSelectedDateAppointments()}
      </div>
    </div>
  );
};

export default AppointmentCalendar;