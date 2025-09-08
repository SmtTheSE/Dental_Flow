import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, Plus, Filter, Search } from 'lucide-react';
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import AppointmentForm from '../components/appointments/AppointmentForm';
import appointmentService, { Appointment } from '../services/appointmentService';

const Appointments: React.FC = () => {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh of calendar
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [stats, setStats] = useState({
    today: 0,
    thisWeek: 0,
    pending: 0,
    completed: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshKey]);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      fetchStats();
      setSearching(false);
    }, 300); // 300ms delay
    
    // Set searching state immediately
    if (searchTerm) {
      setSearching(true);
    }
    
    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  const getWeekRange = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - dayOfWeek);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all appointments
      const allAppointments = await appointmentService.getAllAppointments();
      
      // Ensure we have an array to work with
      const appointments = allAppointments || [];
      
      // Calculate today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayCount = appointments.filter(appt => 
        appt.appointmentDate === today
      ).length;
      
      // Calculate this week's appointments
      const weekRange = getWeekRange();
      const thisWeekCount = appointments.filter(appt => {
        const apptDate = appt.appointmentDate;
        return apptDate >= weekRange.start && apptDate <= weekRange.end;
      }).length;
      
      // Calculate pending appointments
      const pendingCount = appointments.filter(appt => 
        appt.status === 'scheduled'
      ).length;
      
      // Calculate completed appointments
      const completedCount = appointments.filter(appt => 
        appt.status === 'completed'
      ).length;
      
      setStats({
        today: todayCount,
        thisWeek: thisWeekCount,
        pending: pendingCount,
        completed: completedCount
      });
      
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppointmentChange = () => {
    // Increment the refresh key to force the calendar to re-fetch appointments
    setRefreshKey(prev => prev + 1);
    // Refresh stats - now handled by useEffect dependency
  };

  // Helper function to render stat values or loading placeholders
  const renderStatValue = (value: number) => {
    if (loading) {
      return (
        <span className="flex justify-center">
          <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></span>
        </span>
      );
    }
    return value;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <div className="text-gray-600 mt-1">Manage patient appointments and scheduling</div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'calendar' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                view === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List
            </button>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Appointment</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-gray-500">Today</p>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{renderStatValue(stats.today)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <p className="text-sm text-gray-500">This Week</p>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{renderStatValue(stats.thisWeek)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{renderStatValue(stats.pending)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-purple-500" />
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{renderStatValue(stats.completed)}</div>
        </div>
      </div>

      {/* Main Content */}
      {view === 'calendar' ? (
        // Add key to force re-render when refreshKey changes
        <AppointmentCalendar 
          key={refreshKey} 
          onAppointmentChange={handleAppointmentChange}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">List view coming soon</p>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AppointmentForm 
              onClose={() => setShowForm(false)} 
              onAppointmentCreated={handleAppointmentChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;