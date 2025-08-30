import React, { useState } from 'react';
import { Calendar, Clock, Plus, Filter, Search } from 'lucide-react';
import AppointmentCalendar from '../components/appointments/AppointmentCalendar';
import AppointmentForm from '../components/appointments/AppointmentForm';

const Appointments: React.FC = () => {
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage patient appointments and scheduling</p>
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
          <p className="text-2xl font-bold text-gray-900 mt-1">12</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <p className="text-sm text-gray-500">This Week</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">48</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-500">Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">7</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-purple-500" />
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
        </div>
      </div>

      {/* Main Content */}
      {view === 'calendar' ? (
        <AppointmentCalendar />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">List view coming soon</p>
        </div>
      )}

      {/* Appointment Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <AppointmentForm onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;