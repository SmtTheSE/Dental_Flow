// src/pages/ToothAnalysis.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Patient } from '../services/patientService';
import { patientService } from '../services/patientService';
import { treatmentService, ToothAnalysisResult, ToothAnalysisFinding } from '../services/treatmentService';

const ToothAnalysis: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ToothAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients for the dropdown
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const fetchedPatients = await patientService.getAllPatients();
        setPatients(fetchedPatients);
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        setError('Failed to load patients');
      }
    };

    fetchPatients();
  }, []);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.match('image.*')) {
        setError('Please select an image file (PNG/JPG)');
        return;
      }

      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPatientId === '') {
      setError('Please select a patient');
      return;
    }
    
    if (!selectedImage) {
      setError('Please select an X-ray image');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      if (selectedPatientId !== '') {
        const result = await treatmentService.analyzeTooth(selectedPatientId, selectedImage);
        setAnalysisResult(result);
      }
    } catch (err) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tooth Analysis</h1>
        <p className="text-gray-600 mt-2">Upload dental X-rays for AI-powered analysis</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Analysis Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upload X-ray for Analysis</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Selection */}
            <div>
              <label htmlFor="patient" className="block text-sm font-medium text-gray-700 mb-2">
                Select Patient
              </label>
              <select
                id="patient"
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isAnalyzing}
              >
                <option value="">Select a patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.firstName} {patient.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dental X-ray Image
              </label>
              
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  {previewUrl ? (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <img 
                        src={previewUrl} 
                        alt="X-ray preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.016 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                      </svg>
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG (MAX. 10MB)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg"
                    onChange={handleImageChange}
                    disabled={isAnalyzing}
                  />
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-600 text-sm py-2">{error}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAnalyzing || selectedPatientId === '' || !selectedImage}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                isAnalyzing || selectedPatientId === '' || !selectedImage
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } transition-colors duration-200 flex items-center justify-center`}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </>
              ) : (
                'Analyze Tooth'
              )}
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Analysis Results</h2>
          
          {analysisResult ? (
            <div className="space-y-6">
              {/* Findings */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Findings</h3>
                <div className="space-y-3">
                  {analysisResult.findings.map((finding, index) => (
                    <div 
                      key={index} 
                      className="p-4 bg-blue-50 rounded-lg border border-blue-100"
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        </div>
                        <p className="ml-3 text-gray-700">{finding.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annotated Image */}
              {analysisResult.annotatedImageUrl && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Annotated X-ray</h3>
                  <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <img 
                      src={analysisResult.annotatedImageUrl} 
                      alt="Annotated dental X-ray" 
                      className="w-full h-auto rounded"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No analysis yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload an X-ray and run analysis to see results here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToothAnalysis;