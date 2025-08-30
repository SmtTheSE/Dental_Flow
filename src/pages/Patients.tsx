import React, { useState } from 'react';
import { Search, Filter, Plus, Phone, Mail, Calendar, User } from 'lucide-react';
import PatientCard from '../components/patients/PatientCard';

interface Patient {
  id: number;
  name: string;
  age: number;
  phone: string;
  email: string;
  lastVisit: string;
  nextAppointment: string | null;
  treatmentStatus: 'active' | 'completed' | 'pending';
  riskLevel: 'low' | 'medium' | 'high';
  insuranceProvider: string;
}

interface PatientsProps {
  setSelectedPatient: (patient: Patient) => void;
}

const Patients: React.FC<PatientsProps> = ({ setSelectedPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [newPatient, setNewPatient] = useState<Omit<Patient, 'id'>>({
    name: '',
    age: 0,
    phone: '',
    email: '',
    lastVisit: new Date().toISOString().split('T')[0],
    nextAppointment: null,
    treatmentStatus: 'pending',
    riskLevel: 'low',
    insuranceProvider: ''
  });
  const [patients, setPatients] = useState<Patient[]>([
    {
      id: 1,
      name: 'Emma Wilson',
      age: 34,
      phone: '(555) 123-4567',
      email: 'emma.wilson@email.com',
      lastVisit: '2024-12-28',
      nextAppointment: '2025-01-15',
      treatmentStatus: 'active',
      riskLevel: 'low',
      insuranceProvider: 'Delta Dental'
    },
    {
      id: 2,
      name: 'Michael Brown',
      age: 42,
      phone: '(555) 987-6543',
      email: 'michael.brown@email.com',
      lastVisit: '2025-01-08',
      nextAppointment: null,
      treatmentStatus: 'completed',
      riskLevel: 'medium',
      insuranceProvider: 'Aetna'
    },
    {
      id: 3,
      name: 'Sarah Davis',
      age: 28,
      phone: '(555) 456-7890',
      email: 'sarah.davis@email.com',
      lastVisit: '2024-12-20',
      nextAppointment: '2025-01-16',
      treatmentStatus: 'pending',
      riskLevel: 'high',
      insuranceProvider: 'Cigna'
    },
    {
      id: 4,
      name: 'David Miller',
      age: 55,
      phone: '(555) 321-0987',
      email: 'david.miller@email.com',
      lastVisit: '2024-11-15',
      nextAppointment: '2025-01-14',
      treatmentStatus: 'active',
      riskLevel: 'medium',
      insuranceProvider: 'MetLife'
    }
  ]);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.phone.includes(searchTerm);
    const matchesFilter = filterStatus === 'all' || patient.treatmentStatus === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleAddPatient = () => {
    setShowAddPatientModal(true);
  };

  const handleCloseModal = () => {
    setShowAddPatientModal(false);
    // Reset form
    setNewPatient({
      name: '',
      age: 0,
      phone: '',
      email: '',
      lastVisit: new Date().toISOString().split('T')[0],
      nextAppointment: null,
      treatmentStatus: 'pending',
      riskLevel: 'low',
      insuranceProvider: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPatient({
      ...newPatient,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create new patient with incremented ID
    const patientToAdd: Patient = {
      ...newPatient,
      id: Math.max(0, ...patients.map(p => p.id)) + 1
    };
    
    // Add new patient to the list
    setPatients([...patients, patientToAdd]);
    
    // Close modal and reset form
    handleCloseModal();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records and treatment plans</p>
        </div>
        <button 
          className="mt-4 sm:mt-0 inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          onClick={handleAddPatient}
        >
          <Plus className="w-4 h-4" />
          <span>Add New Patient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active Treatment</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPatients.map((patient) => (
          <PatientCard 
            key={patient.id} 
            patient={patient} 
            onSelect={() => setSelectedPatient(patient)}
          />
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Total Patients</p>
          <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">Active Treatments</p>
          <p className="text-2xl font-bold text-blue-600">
            {patients.filter(p => p.treatmentStatus === 'active').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">High Risk</p>
          <p className="text-2xl font-bold text-red-600">
            {patients.filter(p => p.riskLevel === 'high').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-500">This Week</p>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
      </div>

      {/* Add Patient Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Patient</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={newPatient.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                    <input
                      type="number"
                      name="age"
                      value={newPatient.age || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="text"
                      name="phone"
                      value={newPatient.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={newPatient.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Provider</label>
                    <input
                      type="text"
                      name="insuranceProvider"
                      value={newPatient.insuranceProvider}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
                    <select
                      name="riskLevel"
                      value={newPatient.riskLevel}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Patient
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;