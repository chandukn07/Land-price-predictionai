import { useState, useEffect } from 'react';
import { Map, TrendingUp, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ModelRun, Prediction, GridCell } from '../types';

interface PredictionWithGrid extends Prediction {
  grid_cell: GridCell;
}

export function PredictionMap() {
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [predictions, setPredictions] = useState<PredictionWithGrid[]>([]);
  const [loading, setLoading] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });

  useEffect(() => {
    fetchModelRuns();
  }, []);

  useEffect(() => {
    if (selectedRun) {
      fetchPredictions();
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

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          grid_cell:grid_cells(*)
        `)
        .eq('model_run_id', selectedRun)
        .limit(100);

      if (error) throw error;

      const typedData = data as unknown as PredictionWithGrid[];
      setPredictions(typedData || []);

      if (typedData && typedData.length > 0) {
        const prices = typedData.map(p => p.predicted_price);
        setPriceRange({
          min: Math.min(...prices),
          max: Math.max(...prices)
        });
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceColor = (price: number): string => {
    if (priceRange.max === priceRange.min) return 'bg-blue-500';

    const normalized = (price - priceRange.min) / (priceRange.max - priceRange.min);

    if (normalized < 0.2) return 'bg-green-500';
    if (normalized < 0.4) return 'bg-lime-500';
    if (normalized < 0.6) return 'bg-yellow-500';
    if (normalized < 0.8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-6">
          <Map className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Prediction Visualization</h2>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Filter className="w-5 h-5 text-gray-600" />
          <select
            value={selectedRun}
            onChange={(e) => setSelectedRun(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a model run...</option>
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

        {!loading && selectedRun && predictions.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No predictions found for this model run
          </div>
        )}

        {!loading && predictions.length > 0 && (
          <>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Price Range</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{formatPrice(priceRange.min)}</span>
                <div className="flex-1 h-4 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
                <span className="text-sm text-gray-600">{formatPrice(priceRange.max)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[600px] overflow-y-auto">
              {predictions.map((pred) => (
                <div
                  key={pred.id}
                  className="relative group cursor-pointer"
                  title={`Grid: ${pred.grid_cell?.grid_code || 'N/A'}\nPrice: ${formatPrice(pred.predicted_price)}\nDate: ${pred.prediction_date}`}
                >
                  <div
                    className={`aspect-square rounded-lg ${getPriceColor(pred.predicted_price)} hover:scale-110 transition-transform shadow-md`}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-75 rounded-lg">
                    <div className="text-white text-center p-2">
                      <div className="text-xs font-semibold mb-1">
                        {pred.grid_cell?.grid_code || 'N/A'}
                      </div>
                      <div className="text-xs">
                        {formatPrice(pred.predicted_price)}
                      </div>
                      {pred.actual_price && (
                        <div className="text-xs mt-1 text-gray-300">
                          Actual: {formatPrice(pred.actual_price)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Grid Map Visualization</p>
                  <p>
                    Each square represents a grid cell. Colors indicate predicted land prices from
                    low (green) to high (red). Hover over cells to see detailed information.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedRun && !loading && (
          <div className="text-center py-12 text-gray-500">
            Select a model run to view predictions
          </div>
        )}
      </div>
    </div>
  );
}
