import { useEffect, useState } from 'react';
import { Database, Calendar, FileText, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Dataset } from '../types';

export function DatasetList() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      const { data, error } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
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
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Database className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Datasets</h2>
      </div>

      {datasets.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No datasets uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div
              key={dataset.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {dataset.name}
                  </h3>
                  {dataset.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {dataset.description}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(dataset.status)}`}>
                  {dataset.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Records</p>
                    <p className="font-medium text-gray-800">{dataset.record_count}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Date Range</p>
                    <p className="font-medium text-gray-800">
                      {dataset.date_range_start && dataset.date_range_end
                        ? `${new Date(dataset.date_range_start).getFullYear()} - ${new Date(dataset.date_range_end).getFullYear()}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">Uploaded</p>
                    <p className="font-medium text-gray-800">
                      {new Date(dataset.upload_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-500">ID</p>
                    <p className="font-medium text-gray-800 truncate">
                      {dataset.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
