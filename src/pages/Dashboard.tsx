import React from 'react';
import { Calendar, Users, Clock, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import StatCard from '../components/dashboard/StatCard';
import AppointmentsList from '../components/dashboard/AppointmentsList';
import TreatmentQueue from '../components/dashboard/TreatmentQueue';
import RecentActivity from '../components/dashboard/RecentActivity';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const stats: React.ComponentProps<typeof StatCard>[] = [
    {
      title: 'Today\'s Appointments',
      value: '12',
      change: '+3 from yesterday',
      icon: Calendar,
      trend: 'up',
      color: 'blue'
    },
    {
      title: 'Active Patients',
      value: '324',
      change: '+12 this week',
      icon: Users,
      trend: 'up',
      color: 'green'
    },
    {
      title: 'Pending Treatments',
      value: '28',
      change: '5 urgent',
      icon: Clock,
      trend: 'neutral',
      color: 'orange'
    },
    {
      title: 'Monthly Revenue',
      value: '$48,950',
      change: '+15% vs last month',
      icon: TrendingUp,
      trend: 'up',
      color: 'purple'
    }
  ];

  // Determine how to address the user based on their role
  const getUserTitle = () => {
    if (!user) return 'Dr.';
    
    switch (user.role.toLowerCase()) {
      case 'dentist':
        return 'Dr.';
      case 'hygienist':
        return 'Hygienist';
      case 'admin':
        return 'Admin';
      default:
        return '';
    }
  };

  const userTitle = getUserTitle();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Good morning, {user ? `${userTitle} ${user.firstName} ${user.lastName}` : 'Dr. Johnson'}
            </h1>
            <p className="text-blue-100">You have 12 appointments today and 3 treatment plans to review.</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">Today</p>
            <p className="text-xl font-semibold">{new Date().toLocaleDateString('en-US', { 
              weekday: 'long',
              month: 'long',
              day: 'numeric'
            })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Appointments */}
        <div className="lg:col-span-2 space-y-6">
          <AppointmentsList />
          <TreatmentQueue />
        </div>

        {/* Right Column - Activity & Alerts */}
        <div className="space-y-6">
          {/* Quick Alerts */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Alerts</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-800">Emergency Patient</p>
                  <p className="text-xs text-red-600">John Smith - Severe tooth pain</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Insurance Approved</p>
                  <p className="text-xs text-blue-600">Crown treatment for Mary Jones</p>
                </div>
              </div>
            </div>
          </div>

          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;