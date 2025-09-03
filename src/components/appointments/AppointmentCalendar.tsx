import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, Edit, Trash2 } from 'lucide-react';
import appointmentService from '../../services/appointmentService';
import ConfirmationModal from './ConfirmationModal';
import AppointmentForm from './AppointmentForm';

interface Appointment {
  id: number;
  patientId: number;
  dentistId: number;
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

// Helper function to normalize date strings for comparison
const normalizeDate = (dateString: string): string => {
  // If it's already in the correct format (YYYY-MM-DD), return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // If it's an ISO date string, extract the date part
  if (dateString.includes('T')) {
    return dateString.split('T')[0];
  }
  
  // For any other format, return as is
  return dateString;
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

// Helper function to format time (HH:MM or HH:MM:SS -> HH:MM)
const formatTime = (timeString: string): string => {
  // If it's already in the correct format (HH:mm), return as is
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // If it has seconds (HH:mm:ss), remove seconds
  if (/^\d{2}:\d{2}:\d{2}$/.test(timeString)) {
    return timeString.substring(0, 5);
  }
  
  // If it's an ISO time string, extract the time part
  if (timeString.includes('T')) {
    const timePart = timeString.split('T')[1];
    if (timePart.includes('Z')) {
      return timePart.split('Z')[0].substring(0, 5);
    }
    return timePart.substring(0, 5);
  }
  
  // For any other format, return as is
  return timeString;
};

interface AppointmentCalendarProps {
  onAppointmentChange?: () => void;
}

const AppointmentCalendar: React.FC<AppointmentCalendarProps> = ({ 
  onAppointmentChange 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null);
  const [appointmentToUpdate, setAppointmentToUpdate] = useState<Appointment | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    // Handle case where appointments might be null
    if (!appointments) {
      return [];
    }
    
    const dateString = formatDate(date);
    return appointments.filter(appt => normalizeDate(appt.appointmentDate) === dateString);
  };

  // Fetch appointments for the current month
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all appointments
      const allAppointments = await appointmentService.getAppointments();
      // Ensure we always have an array, even if the API returns null
      setAppointments(allAppointments || []);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to load appointments');
      // Set to empty array on error to prevent null issues
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize and fetch appointments
  useEffect(() => {
    fetchAppointments();
  }, [currentDate, onAppointmentChange]);

  // Generate calendar days (including empty cells for start/end of month)
  const generateCalendarDays = (): (Date | null)[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // Day of week for first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = firstDay.getDay();
    // Number of days in the month
    const daysInMonth = lastDay.getDate();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Navigate to today
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Render the calendar header
  const renderHeader = () => {
    return (
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  // Render day names
  const renderDayNames = () => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    return (
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayNames.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
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

  // Handle delete appointment
  const handleDeleteAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment);
    setShowDeleteModal(true);
  };

  // Confirm delete appointment
  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await appointmentService.deleteAppointment(appointmentToDelete.id);
      // Refresh appointments
      fetchAppointments();
      // Also update the parent component if needed
      if (onAppointmentChange) {
        onAppointmentChange();
      }
    } catch (err) {
      console.error('Error deleting appointment:', err);
      setError('Failed to delete appointment');
    }
  };

  // Handle update appointment
  const handleUpdateAppointment = (appointment: Appointment) => {
    setAppointmentToUpdate(appointment);
    setShowUpdateModal(true); // Show the confirmation modal
    setShowEditForm(false); // Make sure the edit form is closed initially
  };

  // Confirm update appointment
  const confirmUpdateAppointment = () => {
    setShowUpdateModal(false);
    setShowEditForm(true);
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
              <div className="flex space-x-1">
                <button
                  onClick={() => handleUpdateAppointment(appointment)}
                  className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors"
                  title="Update appointment"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteAppointment(appointment)}
                  className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                  title="Delete appointment"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAppointmentToDelete(null);
        }}
        onConfirm={confirmDeleteAppointment}
        title="Delete Appointment"
        message="Are you sure you want to delete this appointment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="delete"
      />
      
      {/* Update Confirmation Modal */}
      <ConfirmationModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onConfirm={confirmUpdateAppointment}
        title="Update Appointment"
        message="Are you sure you want to update this appointment?"
        confirmText="Update"
        cancelText="Cancel"
        type="update"
      />
      
      {/* Edit Form */}
      {showEditForm && appointmentToUpdate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AppointmentForm 
              appointment={appointmentToUpdate}
              onClose={() => {
                setShowEditForm(false);
                setAppointmentToUpdate(null);
              }}
              onAppointmentUpdated={() => {
                setShowEditForm(false);
                setAppointmentToUpdate(null);
                fetchAppointments(); // Refresh appointments
                if (onAppointmentChange) {
                  onAppointmentChange();
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentCalendar;