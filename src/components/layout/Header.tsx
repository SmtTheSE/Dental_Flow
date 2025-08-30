import React from 'react';
import { Search, Bell, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user } = useAuth();

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
  const userRole = user?.role ? 
    user.role.charAt(0).toUpperCase() + user.role.slice(1) : 
    'General Dentist';

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search patients, appointments, treatments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Quick Actions */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>

          {/* User Profile */}
          <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user ? `${userTitle} ${user.firstName} ${user.lastName}` : 'Dr. Sarah Johnson'}
              </p>
              <p className="text-xs text-gray-500">{user ? userRole : 'General Dentist'}</p>
            </div>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;