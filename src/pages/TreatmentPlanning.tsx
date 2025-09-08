// src/pages/TreatmentPlanning.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Search, Filter, Calendar, User, Clock, DollarSign, AlertTriangle, Edit, Trash2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import treatmentService, { Treatment, PatientTreatment, CreatePatientTreatmentRequest, CreateTreatmentRequest, UpdatePatientTreatmentRequest } from '../services/treatmentService';
import { useAuth } from '../context/AuthContext';

interface TreatmentPlanningProps {
  selectedPatient: any | null;
}

const TreatmentPlanning: React.FC<TreatmentPlanningProps> = ({ selectedPatient }) => {
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [patientTreatments, setPatientTreatments] = useState<PatientTreatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<boolean>(false);
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [showCreateTreatmentModal, setShowCreateTreatmentModal] = useState(false);
  const [showEditTreatmentModal, setShowEditTreatmentModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null);
  const [selectedPatientTreatment, setSelectedPatientTreatment] = useState<PatientTreatment | null>(null);
  const [newPatientTreatment, setNewPatientTreatment] = useState<CreatePatientTreatmentRequest>({
    patientId: selectedPatient?.id || 0,
    treatmentId: 0,
    status: 'pending',
    priority: 'normal',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [editPatientTreatment, setEditPatientTreatment] = useState<UpdatePatientTreatmentRequest>({
    status: 'pending',
    priority: 'normal',
    startDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const [newTreatment, setNewTreatment] = useState<CreateTreatmentRequest>({
    name: '',
    description: '',
    cost: 0,
    duration: 30,
    category: 'General'
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  
  // For debouncing search requests
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check authentication status
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setAuthError(true);
    }
  }, [isAuthenticated, token]);

  const loadData = async () => {
    if (authError) return;
    
    try {
      setLoading(true);
      const [treatmentsData, patientTreatmentsData] = await Promise.all([
        treatmentService.getAllTreatments(),
        selectedPatient ? treatmentService.getPatientTreatmentsByPatientId(selectedPatient.id) : Promise.resolve([])
      ]);
      
      setTreatments(treatmentsData || []);
      setPatientTreatments(selectedPatient ? (patientTreatmentsData || []) : []);
      setError(null);
    } catch (err) {
      setError('Failed to load treatment data');
      console.error('Error loading treatment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPatient, authError]);

  // Debounced search effect
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      setSearching(false);
    }, 300); // 300ms delay
    
    // Set searching state immediately
    setSearching(true);
    
    // Cleanup timeout on unmount or when dependencies change
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);

  // Filter treatments based on search term
  const filteredTreatments = useMemo(() => {
    if (!searchTerm) return treatments;
    
    const term = searchTerm.toLowerCase();
    return treatments.filter(treatment => 
      treatment.name.toLowerCase().includes(term) ||
      treatment.description.toLowerCase().includes(term) ||
      treatment.category.toLowerCase().includes(term)
    );
  }, [treatments, searchTerm]);

  const handleAddTreatment = (treatment: Treatment) => {
    if (authError) {
      alert('Please log in to add treatments.');
      return;
    }
    
    if (!selectedPatient) {
      alert('Please select a patient first.');
      navigate('/patients');
      return;
    }
    
    setSelectedTreatment(treatment);
    setNewPatientTreatment({
      patientId: selectedPatient?.id || 0,
      treatmentId: treatment.id,
      status: 'pending',
      priority: 'normal',
      startDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowAddTreatmentModal(true);
  };

  const handleEditPatientTreatment = (patientTreatment: PatientTreatment) => {
    if (authError) {
      alert('Please log in to edit treatments.');
      return;
    }
    
    setSelectedPatientTreatment(patientTreatment);
    setEditPatientTreatment({
      status: patientTreatment.status,
      priority: patientTreatment.priority,
      startDate: patientTreatment.startDate,
      notes: patientTreatment.notes
    });
    setShowEditTreatmentModal(true);
  };

  const handleCloseModal = () => {
    setShowAddTreatmentModal(false);
    setSelectedTreatment(null);
  };

  const handleCloseEditModal = () => {
    setShowEditTreatmentModal(false);
    setSelectedPatientTreatment(null);
  };

  const handleCloseCreateModal = () => {
    setShowCreateTreatmentModal(false);
    setNewTreatment({
      name: '',
      description: '',
      cost: 0,
      duration: 30,
      category: 'General'
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewPatientTreatment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditPatientTreatment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTreatmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTreatment(prev => ({
      ...prev,
      [name]: name === 'cost' || name === 'duration' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authError) {
      alert('Please log in to create treatments.');
      return;
    }
    
    try {
      const createdTreatment = await treatmentService.createPatientTreatment(newPatientTreatment);
      setPatientTreatments(prev => [createdTreatment, ...prev]);
      handleCloseModal();
    } catch (err: any) {
      console.error('Error creating patient treatment:', err);
      if (err.message.includes('Authentication')) {
        setAuthError(true);
        setError('Authentication failed. Please log in again.');
      } else {
        alert(err.message || 'Failed to create patient treatment');
      }
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authError || !selectedPatientTreatment) {
      alert('Please log in to edit treatments.');
      return;
    }
    
    try {
      const updatedTreatment = await treatmentService.updatePatientTreatment(selectedPatientTreatment.id, editPatientTreatment);
      setPatientTreatments(prev => prev.map(t => t.id === updatedTreatment.id ? updatedTreatment : t));
      handleCloseEditModal();
    } catch (err: any) {
      console.error('Error updating patient treatment:', err);
      if (err.message.includes('Authentication')) {
        setAuthError(true);
        setError('Authentication failed. Please log in again.');
      } else {
        alert(err.message || 'Failed to update patient treatment');
      }
    }
  };

  const handleDeleteTreatment = async (id: number) => {
    if (authError) {
      alert('Please log in to delete treatments.');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this treatment?')) {
      return;
    }
    
    try {
      await treatmentService.deletePatientTreatment(id);
      setPatientTreatments(prev => prev.filter(t => t.id !== id));
    } catch (err: any) {
      console.error('Error deleting patient treatment:', err);
      if (err.message.includes('Authentication')) {
        setAuthError(true);
        setError('Authentication failed. Please log in again.');
      } else {
        alert(err.message || 'Failed to delete patient treatment');
      }
    }
  };

  const handleSetComplete = async (id: number) => {
    if (authError) {
      alert('Please log in to update treatments.');
      return;
    }
    
    try {
      // Find the current treatment to get its priority value
      const currentTreatment = patientTreatments.find(t => t.id === id);
      if (!currentTreatment) {
        alert('Treatment not found.');
        return;
      }
      
      const updatedTreatment = await treatmentService.updatePatientTreatment(id, { 
        status: 'completed',
        priority: currentTreatment.priority // Include the existing priority to pass validation
      });
      setPatientTreatments(prev => prev.map(t => t.id === updatedTreatment.id ? updatedTreatment : t));
    } catch (err: any) {
      console.error('Error updating patient treatment status:', err);
      if (err.message.includes('Authentication')) {
        setAuthError(true);
        setError('Authentication failed. Please log in again.');
      } else {
        alert(err.message || 'Failed to update patient treatment status');
      }
    }
  };

  const handleCreateTreatment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (authError) {
      alert('Please log in to create treatments.');
      return;
    }
    
    if (!newTreatment.name.trim()) {
      alert('Please enter a treatment name.');
      return;
    }
    
    if (newTreatment.cost < 0) {
      alert('Cost must be a positive number.');
      return;
    }
    
    if (newTreatment.duration <= 0) {
      alert('Duration must be greater than 0.');
      return;
    }
    
    try {
      const createdTreatment = await treatmentService.createTreatment(newTreatment);
      setTreatments(prev => [createdTreatment, ...prev]);
      handleCloseCreateModal();
    } catch (err: any) {
      console.error('Error creating treatment:', err);
      if (err.message.includes('Authentication')) {
        setAuthError(true);
        setError('Authentication failed. Please log in again.');
      } else {
        alert(err.message || 'Failed to create treatment');
      }
    }
  };

  const handleLoginRedirect = () => {
    // Redirect to login page - adjust this based on your routing setup
    window.location.href = '/login';
  };

  const handleSelectPatient = () => {
    navigate('/patients');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Authentication error state
  if (authError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Authentication Required</h3>
          <p className="text-red-600 mb-4">You need to be logged in to access treatment planning.</p>
          <button 
            onClick={handleLoginRedirect}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error && !authError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treatment Planning</h1>
          <p className="text-gray-600">Manage patient treatments and procedures</p>
        </div>
        {selectedPatient && (
          <div className="mt-4 md:mt-0 bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800">Selected Patient</p>
            <p className="text-lg font-semibold text-blue-900">{selectedPatient.firstName} {selectedPatient.lastName}</p>
          </div>
        )}
      </div>

      {!selectedPatient ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <User className="mx-auto h-12 w-12 text-yellow-400" />
          <h3 className="mt-2 text-lg font-medium text-yellow-800">No Patient Selected</h3>
          <p className="mt-1 text-yellow-700">
            Please select a patient to view or create treatments.
          </p>
          <button
            onClick={handleSelectPatient}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Select Patient
          </button>
        </div>
      ) : (
        <>
          {/* Treatment Library */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Treatment Library</h2>
              <div className="flex space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search treatments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${searching ? 'bg-gray-50' : ''}`}
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowCreateTreatmentModal(true)}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  New Treatment
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTreatments.map((treatment) => (
                <div key={treatment.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-gray-900">{treatment.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{treatment.description}</p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      {treatment.category}
                    </span>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {treatment.duration} min
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="w-4 h-4 mr-1" />
                        ${treatment.cost}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddTreatment(treatment)}
                      className="flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Patient Treatments */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Patient Treatments</h2>
            
            {patientTreatments && patientTreatments.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No treatments</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by adding a new treatment for this patient.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Treatment
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dentist
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patientTreatments && patientTreatments.map((treatment) => (
                      <tr key={treatment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{treatment.treatmentName}</div>
                          <div className="text-sm text-gray-500">{treatment.notes}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(treatment.status)}`}>
                            {treatment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(treatment.priority)}`}>
                            {treatment.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {treatment.startDate ? new Date(treatment.startDate).toLocaleDateString() : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {treatment.dentistName || 'Not assigned'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {treatment.status !== 'completed' && (
                            <button
                              onClick={() => handleSetComplete(treatment.id)}
                              className="text-green-600 hover:text-green-900 mr-3"
                              title="Mark as Complete"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleEditPatientTreatment(treatment)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTreatment(treatment.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Treatment Modal */}
      {showAddTreatmentModal && selectedTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Add Treatment for {selectedPatient?.firstName} {selectedPatient?.lastName}</h2>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-900">{selectedTreatment.name}</h3>
                <p className="text-sm text-blue-800 mt-1">{selectedTreatment.description}</p>
                <div className="flex items-center mt-2 text-sm text-blue-700">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="mr-3">{selectedTreatment.duration} minutes</span>
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>${selectedTreatment.cost}</span>
                </div>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={newPatientTreatment.startDate}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        name="priority"
                        value={newPatientTreatment.priority}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={newPatientTreatment.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={newPatientTreatment.notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
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
                    Add Treatment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Treatment Modal */}
      {showEditTreatmentModal && selectedPatientTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Treatment for {selectedPatient?.firstName} {selectedPatient?.lastName}</h2>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-bold text-blue-900">{selectedPatientTreatment.treatmentName}</h3>
                <div className="text-sm text-blue-800 mt-1">{selectedPatientTreatment.notes || 'No notes'}</div>
              </div>
              
              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={editPatientTreatment.startDate}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        name="priority"
                        value={editPatientTreatment.priority}
                        onChange={handleEditInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={editPatientTreatment.status}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={editPatientTreatment.notes}
                      onChange={handleEditInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Update Treatment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Create Treatment Modal */}
      {showCreateTreatmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Treatment</h2>
              
              <form onSubmit={handleCreateTreatment}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Name</label>
                    <input
                      type="text"
                      name="name"
                      value={newTreatment.name}
                      onChange={handleTreatmentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={newTreatment.description}
                      onChange={handleTreatmentInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cost ($)</label>
                      <input
                        type="number"
                        name="cost"
                        min="0"
                        step="0.01"
                        value={newTreatment.cost}
                        onChange={handleTreatmentInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        name="duration"
                        min="1"
                        value={newTreatment.duration}
                        onChange={handleTreatmentInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        name="category"
                        value={newTreatment.category}
                        onChange={handleTreatmentInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="General">General</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Filling">Filling</option>
                        <option value="Crown">Crown</option>
                        <option value="Root Canal">Root Canal</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Orthodontics">Orthodontics</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Create Treatment
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

export default TreatmentPlanning;