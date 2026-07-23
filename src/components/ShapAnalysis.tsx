import { useState, useEffect } from 'react';
import { BarChart3, Info, TrendingUp, TrendingDown, Play, Sparkles } from 'lucide-react';
import { ModelRun, ShapValue } from '../types';
import { apiClient } from '../lib/api';

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
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchModelRuns();
  }, []);

  useEffect(() => {
    if (selectedRun) {
      fetchShapValues();
    }
  }, [selectedRun]);

  const fetchModelRuns = async () => {
    try {
      const data = await apiClient.getModelRuns({ status: 'completed' });
      setModelRuns(data || []);
    } catch (error) {
      console.error('Error fetching model runs:', error);
      setModelRuns([]);
    }
  };

  const fetchShapValues = async () => {
    if (!selectedRun) return;
    
    setLoading(true);
    try {
      const importance = await apiClient.getFeatureImportance(selectedRun);
      
      if (importance && importance.feature_importance) {
        // Map to match the interface with correct field names
        const mappedImportance = importance.feature_importance.map((item: any) => ({
          feature_name: item.feature_name,
          avg_shap_value: item.avg_importance, // Map avg_importance to avg_shap_value
          count: item.sample_count
        }));
        setFeatureImportance(mappedImportance);
      } else {
        setFeatureImportance([]);
      }
      setShapValues([]);
      
    } catch (error) {
      console.error('Error fetching SHAP values:', error);
      setFeatureImportance([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateShapValues = async () => {
    if (!selectedRun) return;
    
    setGenerating(true);
    try {
      await apiClient.generateShapValues(selectedRun);
      // Fetch the generated SHAP values
      await fetchShapValues();
      alert('SHAP values generated successfully!');
    } catch (error) {
      console.error('Error generating SHAP values:', error);
      alert(`Failed to generate SHAP values: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const maxImportance = Math.max(
    ...featureImportance
      .map(f => f.avg_shap_value)
      .filter(v => v !== undefined && v !== null && !isNaN(v)),
    1
  );

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
          <div className="animate-slide-up">
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-blue-300">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl animate-glow" />
                  <Play className="w-16 h-16 text-blue-500 mx-auto relative" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Generate SHAP Analysis</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                  Click the button below to calculate SHAP values and understand which features impact your model's predictions the most.
                </p>
                <button
                  onClick={handleGenerateShapValues}
                  disabled={generating}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Calculating SHAP Values...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Generate SHAP Analysis</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                  {!generating && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-blue-400/0 group-hover:from-blue-400/20 group-hover:via-purple-400/20 group-hover:to-blue-400/20 transition-all duration-500" />
                  )}
                </button>
                <p className="mt-4 text-sm text-gray-500">
                  This will analyze feature importance for all predictions in the dataset
                </p>
              </div>
            </div>
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
                        {feature.avg_shap_value !== undefined && feature.avg_shap_value !== null 
                          ? feature.avg_shap_value.toFixed(4) 
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-500 group-hover:from-blue-600 group-hover:to-blue-700"
                      style={{
                        width: `${feature.avg_shap_value && maxImportance ? (feature.avg_shap_value / maxImportance) * 100 : 0}%`
                      }}
                    />
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-medium text-gray-700 mix-blend-difference">
                        {feature.avg_shap_value && maxImportance 
                          ? ((feature.avg_shap_value / maxImportance) * 100).toFixed(1) 
                          : '0'}% relative importance
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
