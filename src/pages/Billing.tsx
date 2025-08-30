import React, { useState } from 'react';
import { DollarSign, CreditCard, FileText, TrendingUp, Download, Plus, Clock } from 'lucide-react'; // Added Clock to the import

const Billing: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const billingData = {
    monthlyRevenue: 48950,
    pendingPayments: 12400,
    insuranceClaims: 8650,
    collections: 2890
  };

  const recentTransactions = [
    {
      id: 1,
      patient: 'Emma Wilson',
      amount: 285,
      type: 'payment',
      method: 'Credit Card',
      date: '2025-01-08',
      status: 'completed'
    },
    {
      id: 2,
      patient: 'Michael Brown',
      amount: 950,
      type: 'insurance-claim',
      method: 'Delta Dental',
      date: '2025-01-07',
      status: 'pending'
    },
    {
      id: 3,
      patient: 'Sarah Davis',
      amount: 125,
      type: 'payment',
      method: 'Cash',
      date: '2025-01-06',
      status: 'completed'
    }
  ];

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'claims', label: 'Insurance Claims' },
    { id: 'payments', label: 'Payments' },
    { id: 'reports', label: 'Reports' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Insurance</h1>
          <p className="text-gray-600 mt-1">Manage payments, insurance claims, and financial reports</p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button className="inline-flex items-center space-x-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          <button className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${billingData.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+15% from last month</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">${billingData.pendingPayments.toLocaleString()}</p>
              <p className="text-sm text-orange-600">23 outstanding</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Insurance Claims</p>
              <p className="text-2xl font-bold text-gray-900">${billingData.insuranceClaims.toLocaleString()}</p>
              <p className="text-sm text-green-600">5 approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Collections</p>
              <p className="text-2xl font-bold text-gray-900">${billingData.collections.toLocaleString()}</p>
              <p className="text-sm text-purple-600">7 accounts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
              <div className="space-y-4">
                {recentTransactions.map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        transaction.type === 'payment' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {transaction.type === 'payment' ? 
                          <CreditCard className="w-5 h-5 text-green-600" /> :
                          <FileText className="w-5 h-5 text-blue-600" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{transaction.patient}</p>
                        <p className="text-sm text-gray-600">
                          {transaction.type === 'payment' ? 'Payment' : 'Insurance Claim'} • {transaction.method}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${transaction.amount.toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {transaction.status}
                        </span>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Insurance claims management interface</p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Payment processing interface</p>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Financial reports and analytics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Billing;