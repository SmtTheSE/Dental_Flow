import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  CreditCard, 
  BarChart3,
  Stethoscope,
  Settings,
  LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Add this import

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const navigate = useNavigate(); // Add this hook
  
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { id: 'patients', icon: Users, label: 'Patients', path: '/patients' },
    { id: 'appointments', icon: Calendar, label: 'Appointments', path: '/appointments' },
    { id: 'treatment-planning', icon: Stethoscope, label: 'Treatment Planning', path: '/treatment-planning' },
    { id: 'billing', icon: CreditCard, label: 'Billing & Insurance', path: '/billing' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
  ];

  const handleNavigation = (pageId: string, path: string) => {
    setCurrentPage(pageId);
    navigate(path); // This will actually navigate to the page
  };

  return (
    <div className="w-64 bg-white shadow-xl border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DentalFlow</h1>
            <p className="text-sm text-gray-500">Practice Management</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id, item.path)} // Updated this line
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 group ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} 
              />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200">
          <Settings className="w-5 h-5" />
          <span className="font-medium">Settings</span>
        </button>
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200">
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;