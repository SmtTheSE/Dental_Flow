import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Activity } from 'lucide-react';

const Analytics: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice Analytics</h1>
        <p className="text-gray-600 mt-1">Performance insights and data-driven practice management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Patient Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">4.9/5</p>
              <p className="text-sm text-green-600">+0.3 from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Appointment Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">94%</p>
              <p className="text-sm text-green-600">On-time completion rate</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Average Revenue Per Patient</p>
              <p className="text-2xl font-bold text-gray-900">$385</p>
              <p className="text-sm text-purple-600">+12% this quarter</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Treatment Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">97.2%</p>
              <p className="text-sm text-orange-600">Industry leading</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Revenue</h3>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          
          <div className="space-y-4">
            {/* Mock chart data */}
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
              const value = 35000 + (index * 2000) + Math.random() * 5000;
              const percentage = (value / 50000) * 100;
              
              return (
                <div key={month} className="flex items-center space-x-4">
                  <div className="w-8 text-sm text-gray-600">{month}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-20 text-sm font-medium text-gray-900">
                    ${Math.round(value).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Appointment Types */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Appointment Distribution</h3>
            <BarChart3 className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="space-y-4">
            {[
              { type: 'Routine Cleaning', count: 45, color: 'bg-blue-500' },
              { type: 'Restorative', count: 32, color: 'bg-green-500' },
              { type: 'Cosmetic', count: 18, color: 'bg-purple-500' },
              { type: 'Emergency', count: 12, color: 'bg-red-500' },
              { type: 'Consultation', count: 25, color: 'bg-orange-500' }
            ].map((item) => {
              const maxCount = 45;
              const percentage = (item.count / maxCount) * 100;
              
              return (
                <div key={item.type} className="flex items-center space-x-4">
                  <div className="w-24 text-sm text-gray-600">{item.type}</div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className={`${item.color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-8 text-sm font-medium text-gray-900">{item.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Practice Performance Metrics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Patient Retention</h4>
            <p className="text-3xl font-bold text-blue-600 my-2">89%</p>
            <p className="text-sm text-gray-600">Patients return within 12 months</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Schedule Optimization</h4>
            <p className="text-3xl font-bold text-green-600 my-2">92%</p>
            <p className="text-sm text-gray-600">Chair utilization rate</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900">Treatment Success</h4>
            <p className="text-3xl font-bold text-purple-600 my-2">97%</p>
            <p className="text-sm text-gray-600">First-time success rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;