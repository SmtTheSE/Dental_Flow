import React from 'react';
import { AlertTriangle, Pill, Heart, Activity } from 'lucide-react';

const MedicalHistory: React.FC = () => {
  const medicalInfo = {
    allergies: ['Penicillin', 'Latex'],
    medications: ['Metformin 500mg', 'Lisinopril 10mg', 'Vitamin D3'],
    conditions: ['Type 2 Diabetes', 'Hypertension'],
    emergencyContact: {
      name: 'Jane Wilson',
      relationship: 'Sister',
      phone: '(555) 987-1234'
    },
    lastUpdate: '2024-12-28'
  };

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-red-900">Critical Medical Alerts</h4>
            <ul className="text-sm text-red-800 mt-1 space-y-1">
              <li>• Allergic to Penicillin - Use alternative antibiotics</li>
              <li>• Diabetic - Monitor blood sugar during procedures</li>
              <li>• Taking blood pressure medication - Check for drug interactions</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allergies */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h4 className="font-semibold text-gray-900">Allergies & Sensitivities</h4>
          </div>
          <div className="space-y-2">
            {medicalInfo.allergies.map((allergy, index) => (
              <div key={index} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="font-medium text-orange-800">{allergy}</p>
                <p className="text-sm text-orange-600">Documented allergy - avoid in all treatments</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Medications */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Pill className="w-5 h-5 text-blue-500" />
            <h4 className="font-semibold text-gray-900">Current Medications</h4>
          </div>
          <div className="space-y-2">
            {medicalInfo.medications.map((medication, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="font-medium text-blue-800">{medication}</p>
                <button className="text-xs text-blue-600 hover:text-blue-700">
                  Check Interactions
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Medical Conditions */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Heart className="w-5 h-5 text-red-500" />
            <h4 className="font-semibold text-gray-900">Medical Conditions</h4>
          </div>
          <div className="space-y-2">
            {medicalInfo.conditions.map((condition, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="font-medium text-gray-800">{condition}</p>
                <Activity className="w-4 h-4 text-gray-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-green-500" />
            <h4 className="font-semibold text-gray-900">Emergency Contact</h4>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-800">{medicalInfo.emergencyContact.name}</p>
            <p className="text-sm text-green-700">{medicalInfo.emergencyContact.relationship}</p>
            <p className="text-sm text-green-700">{medicalInfo.emergencyContact.phone}</p>
          </div>
        </div>
      </div>

      {/* Update Information */}
      <div className="text-center text-sm text-gray-500 border-t border-gray-200 pt-4">
        Last updated: {new Date(medicalInfo.lastUpdate).toLocaleDateString()}
        <button className="ml-2 text-blue-600 hover:text-blue-700">Update Information</button>
      </div>
    </div>
  );
};

export default MedicalHistory;