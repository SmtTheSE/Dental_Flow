import React, { useState } from 'react';
import { Search, Plus, Clock, DollarSign, FileText } from 'lucide-react';

const ProcedureLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const procedures = [
    {
      id: 1,
      name: 'Routine Cleaning',
      category: 'preventive',
      duration: 45,
      cost: 125,
      description: 'Professional dental cleaning including plaque and tartar removal',
      codeADA: 'D1110'
    },
    {
      id: 2,
      name: 'Composite Filling',
      category: 'restorative',
      duration: 30,
      cost: 285,
      description: 'Tooth-colored filling for small to medium cavities',
      codeADA: 'D2391'
    },
    {
      id: 3,
      name: 'Porcelain Crown',
      category: 'restorative',
      duration: 90,
      cost: 950,
      description: 'Full coverage crown for damaged or weakened teeth',
      codeADA: 'D2740'
    },
    {
      id: 4,
      name: 'Root Canal Therapy',
      category: 'endodontic',
      duration: 120,
      cost: 1250,
      description: 'Endodontic treatment to save infected or damaged tooth',
      codeADA: 'D3330'
    },
    {
      id: 5,
      name: 'Digital X-Rays',
      category: 'diagnostic',
      duration: 15,
      cost: 95,
      description: 'Digital radiographs for diagnostic purposes',
      codeADA: 'D0220'
    },
    {
      id: 6,
      name: 'Teeth Whitening',
      category: 'cosmetic',
      duration: 60,
      cost: 450,
      description: 'Professional in-office teeth whitening treatment',
      codeADA: 'D9972'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Procedures' },
    { id: 'preventive', label: 'Preventive' },
    { id: 'restorative', label: 'Restorative' },
    { id: 'endodontic', label: 'Endodontic' },
    { id: 'cosmetic', label: 'Cosmetic' },
    { id: 'diagnostic', label: 'Diagnostic' }
  ];

  const filteredProcedures = procedures.filter(procedure => {
    const matchesSearch = procedure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         procedure.codeADA.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || procedure.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'preventive': return 'bg-green-100 text-green-800';
      case 'restorative': return 'bg-blue-100 text-blue-800';
      case 'endodontic': return 'bg-red-100 text-red-800';
      case 'cosmetic': return 'bg-purple-100 text-purple-800';
      case 'diagnostic': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search procedures, codes, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.label}</option>
          ))}
        </select>
      </div>

      {/* Procedures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProcedures.map((procedure) => (
          <div 
            key={procedure.id}
            className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  {procedure.name}
                </h4>
                <p className="text-sm text-gray-600 mt-1">Code: {procedure.codeADA}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(procedure.category)}`}>
                {procedure.category}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-4">{procedure.description}</p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="text-sm font-medium text-gray-900">{procedure.duration} min</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-sm font-medium text-gray-900">${procedure.cost}</p>
                </div>
              </div>
            </div>

            <button className="w-full bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors opacity-0 group-hover:opacity-100">
              <Plus className="w-4 h-4 inline mr-2" />
              Add to Treatment Plan
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProcedureLibrary;