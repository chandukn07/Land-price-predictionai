import { useEffect, useState } from 'react';
import { Database, Calendar, FileText, TrendingUp } from 'lucide-react';
import { apiClient } from '../lib/api';
import { Dataset } from '../types';

export function DatasetList() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();

    // Listen for dataset uploads
    const handleDatasetUploaded = () => {
      fetchDatasets();
    };

    window.addEventListener('datasetUploaded', handleDatasetUploaded);
    return () => {
      window.removeEventListener('datasetUploaded', handleDatasetUploaded);
    };
  }, []);

  const fetchDatasets = async () => {
    try {
      const data = await apiClient.getDatasets();
      setDatasets(data || []);
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Dataset['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600/30 border-b-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.01] transition-all duration-300">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <Database className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Datasets</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your training data</p>
        </div>
      </div>

      {datasets.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50/50 to-purple-50/50 rounded-xl border-2 border-dashed border-gray-300">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
            <FileText className="w-20 h-20 text-gray-400 mx-auto mb-4 relative" />
          </div>
          <p className="text-gray-600 font-medium text-lg">No datasets uploaded yet</p>
          <p className="text-gray-400 text-sm mt-2">Upload your first dataset to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {datasets.map((dataset, index) => (
            <div
              key={dataset.id}
              className="group relative bg-gradient-to-br from-white/90 to-white/70 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 hover:border-blue-400/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Gradient border effect on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20 transition-all duration-500 -z-10" />
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                    {dataset.name}
                  </h3>
                  {dataset.description && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                      {dataset.description}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dataset.status)}`}>
                  {dataset.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-xl p-3 border border-blue-100/50 hover:shadow-md transition-all group/stat">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg group-hover/stat:bg-blue-500/20 transition-colors">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-600">Records</p>
                  </div>
                  <p className="text-lg font-bold text-gray-800">{dataset.record_count}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 backdrop-blur-sm rounded-xl p-3 border border-green-100/50 hover:shadow-md transition-all group/stat">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-green-500/10 rounded-lg group-hover/stat:bg-green-500/20 transition-colors">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-600">Date Range</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {dataset.date_range_start && dataset.date_range_end
                      ? `${new Date(dataset.date_range_start).getFullYear()} - ${new Date(dataset.date_range_end).getFullYear()}`
                      : 'N/A'}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50/80 to-pink-50/80 backdrop-blur-sm rounded-xl p-3 border border-purple-100/50 hover:shadow-md transition-all group/stat">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-purple-500/10 rounded-lg group-hover/stat:bg-purple-500/20 transition-colors">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-600">Uploaded</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800">
                    {new Date(dataset.upload_date).toLocaleDateString()}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-orange-50/80 to-amber-50/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100/50 hover:shadow-md transition-all group/stat">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-orange-500/10 rounded-lg group-hover/stat:bg-orange-500/20 transition-colors">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-xs font-medium text-gray-600">ID</p>
                  </div>
                  <p className="text-sm font-bold text-gray-800 font-mono truncate">
                    {dataset.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
