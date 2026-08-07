import { useState, useEffect } from 'react';
import { BarChart3, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ModelRun, ShapValue } from '../types';

interface FeatureImportance {
  feature_name: string;
  avg_shap_value: number;
  count: number;
}

export function ShapAnalysis() {
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [shapValues, setShapValues] = useState<ShapValue[]>([]);
  const [featureImportance, setFeatureImportance] = useState<FeatureImportance[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchModelRuns();
  }, []);

  useEffect(() => {
    if (selectedRun) {
      fetchShapValues();
    }
  }, [selectedRun]);

  const fetchModelRuns = async () => {
    const { data } = await supabase
      .from('model_runs')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false });
    setModelRuns(data || []);
  };

  const fetchShapValues = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shap_values')
        .select('*')
        .eq('model_run_id', selectedRun);

      if (error) throw error;
      setShapValues(data || []);

      const featureMap = new Map<string, { sum: number; count: number }>();

      data?.forEach((shap) => {
        const existing = featureMap.get(shap.feature_name) || { sum: 0, count: 0 };
        featureMap.set(shap.feature_name, {
          sum: existing.sum + Math.abs(shap.shap_value),
          count: existing.count + 1
        });
      });

      const importance: FeatureImportance[] = Array.from(featureMap.entries())
        .map(([feature_name, stats]) => ({
          feature_name,
          avg_shap_value: stats.sum / stats.count,
          count: stats.count
        }))
        .sort((a, b) => b.avg_shap_value - a.avg_shap_value);

      setFeatureImportance(importance);
    } catch (error) {
      console.error('Error fetching SHAP values:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxImportance = Math.max(...featureImportance.map(f => f.avg_shap_value), 1);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">SHAP Feature Importance</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Model Run
          </label>
          <select
            value={selectedRun}
            onChange={(e) => setSelectedRun(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a model run...</option>
            {modelRuns.map((run) => (
              <option key={run.id} value={run.id}>
                {run.model_type.replace('_', ' ').toUpperCase()} - R²: {run.r2_score?.toFixed(4)} - {new Date(run.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && selectedRun && featureImportance.length === 0 && (
          <div className="text-center py-12">
            <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No SHAP values found for this model run</p>
            <p className="text-sm text-gray-400 mt-2">
              SHAP values need to be calculated and stored during model training
            </p>
          </div>
        )}

        {!loading && featureImportance.length > 0 && (
          <>
            <div className="space-y-3">
              {featureImportance.map((feature, index) => (
                <div key={feature.feature_name} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {feature.feature_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({feature.count} samples)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {index < 3 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-sm font-semibold text-gray-800">
                        {feature.avg_shap_value.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-700"
                      style={{
                        width: `${(feature.avg_shap_value / maxImportance) * 100}%`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-gray-700 mix-blend-difference">
                        {((feature.avg_shap_value / maxImportance) * 100).toFixed(1)}% relative importance
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">About SHAP Values</p>
                  <p className="mb-2">
                    SHAP (SHapley Additive exPlanations) values measure each feature's contribution
                    to the model's predictions. Higher absolute SHAP values indicate more important features.
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Positive SHAP values increase predicted price</li>
                    <li>Negative SHAP values decrease predicted price</li>
                    <li>Values shown are averaged across all predictions</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 grid md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Total Features</p>
                <p className="text-2xl font-bold text-gray-800">
                  {featureImportance.length}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Most Important</p>
                <p className="text-lg font-bold text-gray-800">
                  {featureImportance[0]?.feature_name.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Top 3 Avg Impact</p>
                <p className="text-2xl font-bold text-gray-800">
                  {featureImportance
                    .slice(0, 3)
                    .reduce((sum, f) => sum + f.avg_shap_value, 0)
                    .toFixed(4)}
                </p>
              </div>
            </div>
          </>
        )}

        {!selectedRun && !loading && (
          <div className="text-center py-12 text-gray-500">
            Select a model run to view SHAP analysis
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Implementation Note:</p>
            <p>
              SHAP values must be calculated during model training using the SHAP Python library
              and stored in the database. This visualization displays pre-computed SHAP values
              for model interpretability analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
