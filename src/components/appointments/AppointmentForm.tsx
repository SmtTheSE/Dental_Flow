import React, { useState, useEffect, useRef } from 'react';
import { X, Calendar, Clock, User, FileText, Search } from 'lucide-react';
import appointmentService, { CreateAppointmentRequest, UpdateAppointmentRequest, Appointment } from '../../services/appointmentService';
import patientService, { Patient } from '../../services/patientService';

interface AppointmentFormProps {
  onClose: () => void;
  onAppointmentCreated?: () => void;
  onAppointmentUpdated?: () => void;
  appointment?: Appointment; // Existing appointment for editing
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ 
  onClose, 
  onAppointmentCreated, 
  onAppointmentUpdated,
  appointment 
}) => {
  // Helper function to format date for input
  const formatDateForInput = (dateString: string): string => {
    // If it's already in the correct format (YYYY-MM-DD), return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // If it's an ISO date string, extract the date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // For any other format, try to parse and format
    return dateString;
  };

  // Helper function to format time for input
  const formatTimeForInput = (timeString: string): string => {
    // If it's already in the correct format (HH:mm), return as is
    if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeString)) {
      return timeString.substring(0, 5); // Ensure it's HH:mm format
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

  const [formData, setFormData] = useState({
    patientId: appointment?.patientId || 0,
    date: appointment?.appointmentDate ? formatDateForInput(appointment.appointmentDate) : new Date().toISOString().split('T')[0],
    startTime: appointment?.startTime ? formatTimeForInput(appointment.startTime) : '09:00',
    status: appointment?.status || 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'no-show',
    notes: appointment?.notes || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const appointmentTypes = [
    'Routine Cleaning',
    'Examination',
    'Filling',
    'Crown',
    'Root Canal',
    'Extraction',
    'Orthodontic Consultation',
    'Emergency Visit',
    'Follow-up'
  ];

  // Fetch all patients initially
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientList = await patientService.getAllPatients();
        setPatients(patientList);
        setFilteredPatients(patientList);
        
        // If editing an appointment, find the patient and set the search term
        if (appointment && appointment.patientId) {
          const patient = patientList.find(p => p.id === appointment.patientId);
          if (patient) {
            setSearchTerm(`${patient.firstName} ${patient.lastName}`);
          }
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };

    fetchPatients();
  }, [appointment]);

  // Handle clicks outside the search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = patients.filter(patient => 
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(term) ||
        patient.email.toLowerCase().includes(term) ||
        patient.phone.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    }
  }, [searchTerm, patients]);

  const handlePatientSelect = (patient: Patient) => {
    setFormData({...formData, patientId: patient.id});
    setSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setShowDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.patientId || !formData.date || !formData.startTime) {
        throw new Error('Please fill in all required fields');
      }

      if (appointment) {
        // Update existing appointment
        const appointmentData: UpdateAppointmentRequest = {
          patientId: formData.patientId,
          appointmentDate: formData.date,
          startTime: formData.startTime,
          status: formData.status,
          notes: formData.notes
        };

        await appointmentService.updateAppointment(appointment.id, appointmentData);
        
        if (onAppointmentUpdated) {
          onAppointmentUpdated();
        }
      } else {
        // Create new appointment
        const appointmentData: CreateAppointmentRequest = {
          patientId: formData.patientId,
          appointmentDate: formData.date,
          startTime: formData.startTime,
          status: formData.status,
          notes: formData.notes
        };

        await appointmentService.createAppointment(appointmentData);
        
        if (onAppointmentCreated) {
          onAppointmentCreated();
        }
      }
      
      onClose();
    } catch (err: any) {
      let errorMessage = appointment 
        ? 'Failed to update appointment. Please try again.' 
        : 'Failed to create appointment. Please try again.';
      
      if (err.response && err.response.data) {
        if (err.response.data.error) {
          errorMessage = err.response.data.error;
        } else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {appointment ? 'Update Appointment' : 'Schedule New Appointment'}
        </h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Patient
          </label>
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search patients..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                disabled={loading}
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {showDropdown && filteredPatients.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="font-medium text-gray-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {patient.email} • {patient.phone}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {formData.patientId > 0 && (
            <div className="mt-2 text-sm text-gray-600">
              Selected: {searchTerm} (ID: {formData.patientId})
            </div>
          )}
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-2" />
              Start Time
            </label>
            <input
              type="time"
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            />
          </div>
        </div>

        {/* Appointment Type and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type
            </label>
            <select
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="">Select type...</option>
              {appointmentTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value as any})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            rows={3}
            placeholder="Additional notes for this appointment..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !formData.patientId}
          >
            {loading ? (appointment ? 'Updating...' : 'Scheduling...') : (appointment ? 'Update Appointment' : 'Schedule Appointment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;