import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, FileText } from 'lucide-react';
import appointmentService, { CreateAppointmentRequest } from '../../services/appointmentService';
import patientService, { Patient } from '../../services/patientService';

interface AppointmentFormProps {
  onClose: () => void;
  onAppointmentCreated?: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ onClose, onAppointmentCreated }) => {
  const [formData, setFormData] = useState({
    patientId: 0,
    date: '',
    startTime: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'cancelled' | 'no-show',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);

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

  // Fetch patients for selection
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const patientList = await patientService.getAllPatients();
        setPatients(patientList);
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };

    fetchPatients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.patientId || !formData.date || !formData.startTime) {
        throw new Error('Please fill in all required fields');
      }

      // Debug: Check token before making request
      const token = localStorage.getItem('dental_token');
      console.log('=== DEBUGGING APPOINTMENT CREATION ===');
      console.log('Token exists:', !!token);
      console.log('Token value:', token);
      console.log('Form data:', formData);

      const appointmentData: CreateAppointmentRequest = {
        patientId: formData.patientId,
        appointmentDate: formData.date,
        startTime: formData.startTime,
        status: formData.status,
        notes: formData.notes
      };

      console.log('Appointment data to send:', appointmentData);

      // Test the token by making a simple request first
      try {
        console.log('Testing token with getAppointments...');
        await appointmentService.getAppointments();
        console.log('Token test successful');
      } catch (tokenError) {
        console.error('Token test failed:', tokenError);
        throw new Error('Authentication token is invalid or expired');
      }

      console.log('Creating appointment...');
      const result = await appointmentService.createAppointment(appointmentData);
      console.log('Appointment created successfully:', result);
      
      if (onAppointmentCreated) {
        onAppointmentCreated();
      }
      
      onClose();
    } catch (err: any) {
      console.error('Full error object:', err);
      console.error('Error response:', err.response);
      
      let errorMessage = 'Failed to create appointment. Please try again.';
      
      // Check if it's an axios error with response data
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
        <h2 className="text-xl font-semibold text-gray-900">Schedule New Appointment</h2>
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
          {/* Debug info for auth errors */}
          {error.includes('Authorization') && (
            <div className="mt-2 text-xs text-red-600">
              <p>Token exists: {!!localStorage.getItem('dental_token')}</p>
              <p>Token length: {localStorage.getItem('dental_token')?.length || 0}</p>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Patient Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Patient
          </label>
          <select
            value={formData.patientId || ''}
            onChange={(e) => setFormData({...formData, patientId: parseInt(e.target.value) || 0})}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={loading}
          >
            <option value="">Select a patient...</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name} (ID: {patient.id})
              </option>
            ))}
          </select>
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
            <select
              value={formData.startTime}
              onChange={(e) => setFormData({...formData, startTime: e.target.value})}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loading}
            >
              <option value="">Select time...</option>
              <option value="08:00">8:00 AM</option>
              <option value="08:30">8:30 AM</option>
              <option value="09:00">9:00 AM</option>
              <option value="09:30">9:30 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="10:30">10:30 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="14:00">2:00 PM</option>
              <option value="14:30">2:30 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="15:30">3:30 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="16:30">4:30 PM</option>
              <option value="17:00">5:00 PM</option>
            </select>
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
              required
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
            disabled={loading}
          >
            {loading ? 'Scheduling...' : 'Schedule Appointment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AppointmentForm;