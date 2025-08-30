import React, { useState } from 'react';
import { Plus, Edit, Eye } from 'lucide-react';

const DentalChart: React.FC = () => {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  // Dental notation - Adult teeth numbering (1-32)
  const upperTeeth = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
  const lowerTeeth = [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17];

  // Mock treatment data
  const treatments = {
    3: { type: 'filling', status: 'completed', color: 'bg-blue-500' },
    7: { type: 'crown', status: 'planned', color: 'bg-yellow-500' },
    14: { type: 'cavity', status: 'needs-treatment', color: 'bg-red-500' },
    19: { type: 'filling', status: 'completed', color: 'bg-blue-500' },
    26: { type: 'cleaning', status: 'completed', color: 'bg-green-500' }
  };

  const getToothStyle = (toothNumber: number) => {
    const treatment = treatments[toothNumber as keyof typeof treatments];
    if (treatment) {
      return `${treatment.color} text-white`;
    }
    return selectedTooth === toothNumber ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200';
  };

  const ToothButton = ({ number }: { number: number }) => (
    <button
      onClick={() => setSelectedTooth(number)}
      className={`w-8 h-8 rounded text-xs font-medium transition-all duration-200 ${getToothStyle(number)}`}
      title={`Tooth ${number}`}
    >
      {number}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Dental Chart</h3>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Add Treatment</span>
          </button>
          <button className="flex items-center space-x-2 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4" />
            <span>Edit Mode</span>
          </button>
        </div>
      </div>

      {/* Dental Chart */}
      <div className="bg-gray-50 rounded-xl p-8">
        <div className="max-w-4xl mx-auto">
          {/* Upper Teeth */}
          <div className="text-center mb-8">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Upper Teeth</h4>
            <div className="flex justify-center space-x-2 mb-2">
              {upperTeeth.slice(0, 8).map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
            <div className="flex justify-center space-x-2">
              {upperTeeth.slice(8, 16).map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
          </div>

          {/* Mouth Representation */}
          <div className="flex justify-center my-8">
            <div className="w-64 h-32 border-4 border-gray-300 rounded-full bg-white flex items-center justify-center">
              <span className="text-gray-400 text-sm">Oral Cavity</span>
            </div>
          </div>

          {/* Lower Teeth */}
          <div className="text-center">
            <div className="flex justify-center space-x-2 mb-2">
              {lowerTeeth.slice(0, 8).map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
            <div className="flex justify-center space-x-2 mb-4">
              {lowerTeeth.slice(8, 16).map(num => (
                <ToothButton key={num} number={num} />
              ))}
            </div>
            <h4 className="text-sm font-medium text-gray-700">Lower Teeth</h4>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Treatment Legend</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-700">Completed Filling</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-sm text-gray-700">Planned Treatment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-sm text-gray-700">Needs Treatment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-700">Preventive Care</span>
          </div>
        </div>
      </div>

      {/* Selected Tooth Info */}
      {selectedTooth && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Tooth #{selectedTooth} Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Current Status</h5>
              <p className="text-gray-900">
                {treatments[selectedTooth as keyof typeof treatments]?.type || 'Healthy'}
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-2">Last Treatment</h5>
              <p className="text-gray-900">Routine cleaning - Dec 28, 2024</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
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
          {activeTab === 'treatment-history' && <TreatmentHistory />}
          {activeTab === 'medical-history' && <MedicalHistory />}
          {activeTab === 'billing' && (
            <div className="text-center py-8">
              <p className="text-gray-500">Billing information for {patient.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DentalChart;