import React, { useState } from 'react';
import { FileText, Plus, Search, Filter, Stethoscope } from 'lucide-react';
import TreatmentPlan from '../components/treatment/TreatmentPlan';
import ProcedureLibrary from '../components/treatment/ProcedureLibrary';

const TreatmentPlanning: React.FC = () => {
  const [activeTab, setActiveTab] = useState('plans');

  const treatmentPlans = [
    {
      id: 1,
      patient: 'Emma Wilson',
      title: 'Comprehensive Oral Rehabilitation',
      procedures: ['Crown #7', 'Filling #12', 'Deep Cleaning'],
      status: 'in-progress',
      startDate: '2024-12-28',
      estimatedCompletion: '2025-02-15',
      totalCost: 2850,
      insuranceCovered: 1990
    },
    {
      id: 2,
      patient: 'Michael Brown',
      title: 'Root Canal Treatment Plan',
      procedures: ['Root Canal #19', 'Crown #19', 'Follow-up X-ray'],
      status: 'pending-approval',
      startDate: '2025-01-20',
      estimatedCompletion: '2025-03-01',
      totalCost: 1950,
      insuranceCovered: 1365
    },
    {
      id: 3,
      patient: 'Sarah Davis',
      title: 'Orthodontic Treatment',
      procedures: ['Initial Consultation', 'Digital Impressions', 'Braces Installation'],
      status: 'planning',
      startDate: '2025-02-01',
      estimatedCompletion: '2026-08-01',
      totalCost: 5500,
      insuranceCovered: 2750
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Planning</h1>
          <p className="text-gray-600 mt-1">Create and manage comprehensive treatment plans</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          <span>Create Treatment Plan</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <p className="text-sm text-gray-500">Active Plans</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">18</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-green-500" />
            <p className="text-sm text-gray-500">Completed</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">156</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-orange-500" />
            <p className="text-sm text-gray-500">Pending Approval</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">7</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-purple-500" />
            <p className="text-sm text-gray-500">Total Value</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">$84.5K</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Treatment Plans
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'library'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Procedure Library
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'plans' && (
            <div className="space-y-4">
              {treatmentPlans.map((plan) => (
                <TreatmentPlan key={plan.id} plan={plan} />
              ))}
            </div>
          )}
          {activeTab === 'library' && <ProcedureLibrary />}
        </div>
      </div>
    </div>
  );
};

export default TreatmentPlanning;