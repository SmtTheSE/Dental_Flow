import React, { useState, useEffect } from 'react';
import { FileText, CreditCard, Calendar, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Activity {
  id: number;
  type: 'appointment' | 'payment' | 'treatment' | 'patient';
  description: string;
  time: string;
  icon: React.ComponentType<any>;
  color: string;
  link?: string;
}

const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // In a real app, this would come from an API
  useEffect(() => {
    // Simulating API call
    setTimeout(() => {
      const mockActivities: Activity[] = [
        {
          id: 1,
          type: 'appointment',
          description: 'Appointment scheduled for Emma Wilson',
          time: '10 minutes ago',
          icon: Calendar,
          color: 'blue',
          link: '/appointments'
        },
        {
          id: 2,
          type: 'payment',
          description: 'Payment received from Michael Brown ($350)',
          time: '25 minutes ago',
          icon: CreditCard,
          color: 'green',
          link: '/billing'
        },
        {
          id: 3,
          type: 'treatment',
          description: 'Treatment plan completed for Sarah Davis',
          time: '1 hour ago',
          icon: FileText,
          color: 'purple',
          link: '/patients/3'
        },
        {
          id: 4,
          type: 'patient',
          description: 'New patient registration - David Miller',
          time: '2 hours ago',
          icon: Users,
          color: 'orange',
          link: '/patients/4'
        }
      ];
      setActivities(mockActivities);
      setLoading(false);
    }, 500);
  }, []);

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-600';
      case 'green': return 'bg-green-100 text-green-600';
      case 'purple': return 'bg-purple-100 text-purple-600';
      case 'orange': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const handleActivityClick = (link?: string) => {
    if (link) {
      navigate(link);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

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
              <div 
                key={activity.id} 
                className={`flex items-start space-x-3 ${activity.link ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-lg' : ''}`}
                onClick={() => handleActivityClick(activity.link)}
              >
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