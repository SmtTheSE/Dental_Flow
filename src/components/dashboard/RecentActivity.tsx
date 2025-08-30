import React from 'react';
import { FileText, CreditCard, Calendar, Users } from 'lucide-react';

const RecentActivity: React.FC = () => {
  const activities = [
    {
      id: 1,
      type: 'appointment',
      description: 'Appointment scheduled for Emma Wilson',
      time: '10 minutes ago',
      icon: Calendar,
      color: 'blue'
    },
    {
      id: 2,
      type: 'payment',
      description: 'Payment received from Michael Brown ($350)',
      time: '25 minutes ago',
      icon: CreditCard,
      color: 'green'
    },
    {
      id: 3,
      type: 'treatment',
      description: 'Treatment plan completed for Sarah Davis',
      time: '1 hour ago',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 4,
      type: 'patient',
      description: 'New patient registration - David Miller',
      time: '2 hours ago',
      icon: Users,
      color: 'orange'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getColorClasses(activity.color)}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentActivity;