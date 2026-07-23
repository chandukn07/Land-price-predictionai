import { useState, useEffect } from 'react';
import { Brain, Play, Settings, TrendingUp } from 'lucide-react';
import { Dataset, ModelType, ModelRun } from '../types';
import { apiClient } from '../lib/api';

const MODEL_OPTIONS: { value: ModelType; label: string; description: string }[] = [
  {
    value: 'gradient_boosting',
    label: 'Gradient Boosting',
    description: 'Sequential ensemble method with strong predictive power'
  },
  {
    value: 'xgboost',
    label: 'XGBoost',
    description: 'Optimized gradient boosting with regularization'
  },
  {
    value: 'lightgbm',
    label: 'LightGBM',
    description: 'Fast gradient boosting framework by Microsoft'
  },
  {
    value: 'random_forest',
    label: 'Random Forest',
    description: 'Parallel ensemble of decision trees'
  }
];

export function ModelTraining() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<ModelType>('xgboost');
  const [testSize, setTestSize] = useState(0.2);
  const [recentRuns, setRecentRuns] = useState<ModelRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [hyperparameters, setHyperparameters] = useState({
    n_estimators: 100,
    learning_rate: 0.1,
    max_depth: 6,
    min_samples_split: 2,
    min_samples_leaf: 1
  });

  useEffect(() => {
    fetchDatasets();
    fetchRecentRuns();
  }, []);

  const fetchDatasets = async () => {
    try {
      const data = await apiClient.getDatasets();
      // Filter only ready datasets
      const readyDatasets = (data || []).filter((ds: Dataset) => ds.status === 'ready');
      setDatasets(readyDatasets);
    } catch (error) {
      console.error('Error fetching datasets:', error);
      setDatasets([]);
    }
  };

  const fetchRecentRuns = async () => {
    try {
      const data = await apiClient.getModelRuns({ limit: 5 });
      setRecentRuns(data || []);
    } catch (error) {
      console.error('Error fetching recent runs:', error);
      setRecentRuns([]);
    }
  };

  const handleTrainModel = async () => {
    if (!selectedDataset) {
      alert('Please select a dataset');
      return;
    }

    setLoading(true);

    try {
      // Create model run record in database
      const modelRun = await apiClient.createModelRun(
        selectedModel,
        selectedDataset,
        hyperparameters
      );

      // Call Flask backend to start actual training
      const trainingResponse = await apiClient.startTraining({
        model_run_id: modelRun.id,
        dataset_id: selectedDataset,
        model_type: selectedModel,
        hyperparameters,
        test_size: testSize
      });

      const r2Score = trainingResponse.metrics.test_r2;
      const scoreText = r2Score !== null && r2Score !== undefined 
        ? r2Score.toFixed(4) 
        : 'N/A';
      
      alert(`Model training completed successfully! R² Score: ${scoreText}`);

      fetchRecentRuns();
    } catch (error) {
      console.error('Error training model:', error);
      alert(`Failed to train model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: ModelRun['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Brain className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Train Model</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Dataset *
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a dataset...</option>
              {datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.record_count} records)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Size
            </label>
            <input
              type="number"
              value={testSize}
              onChange={(e) => setTestSize(parseFloat(e.target.value))}
              min="0.1"
              max="0.5"
              step="0.05"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Percentage of data for testing (0.1 - 0.5)
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Model Type *
          </label>
          <div className="grid md:grid-cols-2 gap-3">
            {MODEL_OPTIONS.map((model) => (
              <button
                key={model.value}
                onClick={() => setSelectedModel(model.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedModel === model.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="font-semibold text-gray-800 mb-1">
                  {model.label}
                </div>
                <div className="text-sm text-gray-600">
                  {model.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="w-5 h-5 text-gray-600" />
            <label className="block text-sm font-medium text-gray-700">
              Hyperparameters
            </label>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                N Estimators
              </label>
              <input
                type="number"
                value={hyperparameters.n_estimators}
                onChange={(e) =>
                  setHyperparameters({
                    ...hyperparameters,
                    n_estimators: parseInt(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Learning Rate
              </label>
              <input
                type="number"
                value={hyperparameters.learning_rate}
                onChange={(e) =>
                  setHyperparameters({
                    ...hyperparameters,
                    learning_rate: parseFloat(e.target.value)
                  })
                }
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Max Depth
              </label>
              <input
                type="number"
                value={hyperparameters.max_depth}
                onChange={(e) =>
                  setHyperparameters({
                    ...hyperparameters,
                    max_depth: parseInt(e.target.value)
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleTrainModel}
          disabled={loading || !selectedDataset}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Training Job...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Start Training
            </>
          )}
        </button>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p className="font-medium mb-1">✅ Backend Connected:</p>
          <p>
            Flask ML backend is integrated with scikit-learn, XGBoost, LightGBM, and SHAP.
            Training will execute actual machine learning models with SHAP interpretability analysis.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Recent Training Runs</h2>
        </div>

        {recentRuns.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No training runs yet</p>
        ) : (
          <div className="space-y-3">
            {recentRuns.map((run) => (
              <div
                key={run.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {run.model_type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(run.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(run.status)}`}
                  >
                    {run.status}
                  </span>
                </div>

                {run.status === 'completed' && (
                  <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500">R² Score</p>
                      <p className="font-semibold text-gray-800">
                        {run.r2_score?.toFixed(4) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">RMSE</p>
                      <p className="font-semibold text-gray-800">
                        {run.rmse?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MAE</p>
                      <p className="font-semibold text-gray-800">
                        {run.mae?.toFixed(2) || 'N/A'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
