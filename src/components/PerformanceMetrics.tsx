import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Target, Clock, Award } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ModelRun } from '../types';

interface MetricCard {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export function PerformanceMetrics() {
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelRuns();
  }, []);

  const fetchModelRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('model_runs')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModelRuns(data || []);
    } catch (error) {
      console.error('Error fetching model runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBestModel = () => {
    if (modelRuns.length === 0) return null;
    return modelRuns.reduce((best, current) => {
      if (!best.r2_score) return current;
      if (!current.r2_score) return best;
      return current.r2_score > best.r2_score ? current : best;
    });
  };

  const getAverageMetrics = () => {
    if (modelRuns.length === 0) return { r2: 0, rmse: 0, mae: 0 };

    const validRuns = modelRuns.filter(
      (run) => run.r2_score !== null && run.rmse !== null && run.mae !== null
    );

    if (validRuns.length === 0) return { r2: 0, rmse: 0, mae: 0 };

    return {
      r2:
        validRuns.reduce((sum, run) => sum + (run.r2_score || 0), 0) /
        validRuns.length,
      rmse:
        validRuns.reduce((sum, run) => sum + (run.rmse || 0), 0) /
        validRuns.length,
      mae:
        validRuns.reduce((sum, run) => sum + (run.mae || 0), 0) / validRuns.length
    };
  };

  const bestModel = getBestModel();
  const avgMetrics = getAverageMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (modelRuns.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No completed model runs yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Train models to see performance metrics
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Performance Overview</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Total Runs</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">{modelRuns.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Best R²</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {bestModel?.r2_score?.toFixed(4) || 'N/A'}
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">Avg RMSE</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {avgMetrics.rmse.toFixed(2)}
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Avg MAE</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {avgMetrics.mae.toFixed(2)}
            </p>
          </div>
        </div>

        {bestModel && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-bold text-gray-800">Best Performing Model</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Model Type</p>
                <p className="text-lg font-semibold text-gray-800">
                  {bestModel.model_type.replace('_', ' ').toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Training Date</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(bestModel.created_at).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">R² Score</p>
                <p className="text-lg font-semibold text-gray-800">
                  {bestModel.r2_score?.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">RMSE</p>
                <p className="text-lg font-semibold text-gray-800">
                  {bestModel.rmse?.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">All Model Runs</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Model Type
                </th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  R² Score
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  RMSE
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  MAE
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                  Training Time
                </th>
              </tr>
            </thead>
            <tbody>
              {modelRuns.map((run, index) => (
                <tr
                  key={run.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    index === 0 ? 'bg-blue-50' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-sm font-medium text-gray-800">
                    {run.model_type.replace('_', ' ').toUpperCase()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(run.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 text-right font-semibold">
                    {run.r2_score?.toFixed(4) || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 text-right">
                    {run.rmse?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800 text-right">
                    {run.mae?.toFixed(2) || 'N/A'}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 text-right">
                    {run.training_time_seconds
                      ? `${run.training_time_seconds.toFixed(1)}s`
                      : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Model Comparison</h3>
        <div className="space-y-4">
          {modelRuns.slice(0, 5).map((run) => (
            <div key={run.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-gray-800">
                  {run.model_type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(run.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">R² Score</span>
                    <span className="font-semibold text-gray-800">
                      {run.r2_score?.toFixed(4) || 'N/A'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                      style={{
                        width: `${Math.max(0, Math.min(100, (run.r2_score || 0) * 100))}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
