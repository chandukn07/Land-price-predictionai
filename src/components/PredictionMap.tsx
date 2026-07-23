import { useState, useEffect } from 'react';
import { Map, TrendingUp, Filter, Play, ArrowRight, Sparkles, Download, BarChart3, DollarSign, Grid3x3, Activity, Award, TrendingDown, Zap, Target, PieChart } from 'lucide-react';
import { ModelRun } from '../types';
import { apiClient } from '../lib/api';

export function PredictionMap() {
  const [modelRuns, setModelRuns] = useState<ModelRun[]>([]);
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [showCharts, setShowCharts] = useState(true);
  const [selectedComparisons, setSelectedComparisons] = useState<string[]>([]);

  useEffect(() => {
    fetchModelRuns();
  }, []);

  useEffect(() => {
    if (selectedRun) {
      fetchPredictions();
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

  const fetchPredictions = async () => {
    if (!selectedRun) return;
    
    setLoading(true);
    try {
      const result = await apiClient.getPredictions(selectedRun);
      const preds = result.predictions || [];
      setPredictions(preds);
      
      // Calculate price range
      if (preds.length > 0) {
        const prices = preds.map((p: any) => p.predicted_price);
        setPriceRange({
          min: Math.min(...prices),
          max: Math.max(...prices)
        });
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePredictions = async () => {
    if (!selectedRun) return;
    
    setGenerating(true);
    try {
      await apiClient.generatePredictions(selectedRun);
      // Fetch the generated predictions
      await fetchPredictions();
      alert('Predictions generated successfully!');
    } catch (error) {
      console.error('Error generating predictions:', error);
      alert(`Failed to generate predictions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
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
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatPriceShort = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)}Cr`;
    } else if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)}L`;
    }
    return formatPrice(price);
  };

  const exportToCSV = () => {
    if (predictions.length === 0) return;

    const headers = ['Grid Cell ID', 'Prediction Date', 'Predicted Price (INR)', 'Actual Price (INR)', 'Created At'];
    const rows = predictions.map(pred => [
      pred.grid_cell_id,
      pred.prediction_date || '',
      pred.predicted_price,
      pred.actual_price || 'N/A',
      pred.created_at || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions_${selectedRun}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getStatistics = () => {
    if (predictions.length === 0) return null;

    const prices = predictions.map(p => p.predicted_price);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const sorted = [...prices].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const stdDev = Math.sqrt(
      prices.reduce((sum, price) => sum + Math.pow(price - avg, 2), 0) / prices.length
    );

    return { avg, median, stdDev, count: prices.length };
  };

  const stats = getStatistics();

  const getPriceDistribution = () => {
    if (predictions.length === 0) return [];
    
    const prices = predictions.map(p => p.predicted_price);
    const bucketCount = 8;
    const bucketSize = (priceRange.max - priceRange.min) / bucketCount;
    
    const buckets = Array(bucketCount).fill(0).map((_, i) => ({
      range: `${formatPriceShort(priceRange.min + i * bucketSize)} - ${formatPriceShort(priceRange.min + (i + 1) * bucketSize)}`,
      count: 0,
      min: priceRange.min + i * bucketSize,
      max: priceRange.min + (i + 1) * bucketSize
    }));
    
    prices.forEach(price => {
      const bucketIndex = Math.min(
        Math.floor((price - priceRange.min) / bucketSize),
        bucketCount - 1
      );
      if (bucketIndex >= 0 && bucketIndex < bucketCount) {
        buckets[bucketIndex].count++;
      }
    });
    
    return buckets;
  };

  const getTopBottomAreas = () => {
    if (predictions.length === 0) return { top: [], bottom: [] };
    
    const sorted = [...predictions].sort((a, b) => b.predicted_price - a.predicted_price);
    return {
      top: sorted.slice(0, 5),
      bottom: sorted.slice(-5).reverse()
    };
  };

  const toggleComparison = (gridId: string) => {
    setSelectedComparisons(prev => {
      if (prev.includes(gridId)) {
        return prev.filter(id => id !== gridId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), gridId];
      }
      return [...prev, gridId];
    });
  };

  const distribution = getPriceDistribution();
  const { top, bottom } = getTopBottomAreas();
  const maxDistCount = Math.max(...distribution.map(d => d.count), 1);
  const comparedAreas = predictions.filter(p => selectedComparisons.includes(p.grid_cell_id));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.01] transition-all duration-300">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg animate-float">
            <Map className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Prediction Visualization</h2>
            <p className="text-sm text-gray-500 mt-1">View model predictions on grid map</p>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full animate-pulse" />
            Select Trained Model
          </label>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100/50 backdrop-blur-sm rounded-lg">
              <Filter className="w-5 h-5 text-blue-600" />
            </div>
            <select
              value={selectedRun}
              onChange={(e) => setSelectedRun(e.target.value)}
              className="flex-1 px-5 py-3.5 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md font-medium"
            >
              <option value="">Choose a trained model run...</option>
              {modelRuns.map((run) => (
                <option key={run.id} value={run.id}>
                  {run.model_type.replace('_', ' ').toUpperCase()} - R²: {run.r2_score?.toFixed(4)} - {new Date(run.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center h-64 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-600/30 border-b-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
            </div>
            <p className="mt-4 text-gray-600 font-medium">Loading predictions...</p>
          </div>
        )}

        {!loading && selectedRun && predictions.length === 0 && (
          <div className="animate-slide-up">
            <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-blue-300">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl animate-glow" />
                  <Play className="w-16 h-16 text-blue-500 mx-auto relative" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Generate Predictions</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                  Click the button below to generate price predictions for this model's dataset.
                </p>
                <button
                  onClick={handleGeneratePredictions}
                  disabled={generating}
                  className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {generating ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating Predictions...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      <span>Generate Predictions</span>
                      <Sparkles className="w-5 h-5" />
                    </>
                  )}
                  {!generating && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/0 via-purple-400/0 to-blue-400/0 group-hover:from-blue-400/20 group-hover:via-purple-400/20 group-hover:to-blue-400/20 transition-all duration-500" />
                  )}
                </button>
                <p className="mt-4 text-sm text-gray-500">
                  This will create predictions for all data points in the training dataset
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && predictions.length > 0 && (
          <div className="animate-slide-up space-y-6">
            {/* Export Button */}
            <div className="flex justify-end">
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
              >
                <Download className="w-5 h-5" />
                Export to CSV
              </button>
            </div>

            {/* Statistics Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 backdrop-blur-sm rounded-xl p-5 border-2 border-blue-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Grid3x3 className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-sm font-semibold text-blue-900">Total Predictions</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-900">{stats.count}</p>
                  <p className="text-xs text-blue-700 mt-1">Grid cells analyzed</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 backdrop-blur-sm rounded-xl p-5 border-2 border-green-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-sm font-semibold text-green-900">Average Price</p>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{formatPriceShort(stats.avg)}</p>
                  <p className="text-xs text-green-700 mt-1">Mean prediction</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 backdrop-blur-sm rounded-xl p-5 border-2 border-purple-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <p className="text-sm font-semibold text-purple-900">Median Price</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{formatPriceShort(stats.median)}</p>
                  <p className="text-xs text-purple-700 mt-1">Middle value</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 backdrop-blur-sm rounded-xl p-5 border-2 border-orange-200 hover:shadow-lg transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-500/20 rounded-lg">
                      <Activity className="w-5 h-5 text-orange-600" />
                    </div>
                    <p className="text-sm font-semibold text-orange-900">Std Deviation</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">{formatPriceShort(stats.stdDev)}</p>
                  <p className="text-xs text-orange-700 mt-1">Price variance</p>
                </div>
              </div>
            )}

            {/* Price Range Bar */}
            <div className="bg-gradient-to-r from-green-50 via-yellow-50 to-red-50 rounded-xl p-5 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price Distribution Range
                </span>
                <span className="text-xs font-medium text-gray-500 bg-white/80 px-3 py-1 rounded-full">{predictions.length} predictions</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Minimum</p>
                  <span className="text-sm font-bold text-gray-800 bg-white/80 px-3 py-2 rounded-lg block">{formatPriceShort(priceRange.min)}</span>
                </div>
                <div className="flex-1 h-8 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 shadow-lg relative">
                  <div className="absolute inset-0 rounded-full bg-white/10" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Maximum</p>
                  <span className="text-sm font-bold text-gray-800 bg-white/80 px-3 py-2 rounded-lg block">{formatPriceShort(priceRange.max)}</span>
                </div>
              </div>
            </div>

            {/* Charts Toggle */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setShowCharts(!showCharts)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all"
              >
                <PieChart className="w-4 h-4" />
                {showCharts ? 'Hide' : 'Show'} Advanced Analytics
              </button>
            </div>

            {/* Advanced Analytics Section */}
            {showCharts && (
              <div className="space-y-6 mb-6 animate-slide-up">
                {/* Price Distribution Histogram */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <BarChart3 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">Price Distribution Histogram</h3>
                      <p className="text-sm text-gray-600">Frequency distribution across price ranges</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {distribution.map((bucket, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-semibold text-gray-700">{bucket.range}</span>
                          <span className="text-purple-600 font-bold">{bucket.count} areas</span>
                        </div>
                        <div className="relative h-8 bg-white/50 rounded-lg overflow-hidden border border-purple-200">
                          <div
                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 flex items-center justify-end pr-2"
                            style={{ width: `${(bucket.count / maxDistCount) * 100}%` }}
                          >
                            {bucket.count > 0 && (
                              <span className="text-xs font-bold text-white">{bucket.count}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top & Bottom Areas */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Top 5 Most Expensive */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-sm rounded-xl p-6 border-2 border-amber-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-500/20 rounded-lg">
                        <Award className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">🏆 Top 5 Most Expensive</h3>
                        <p className="text-xs text-gray-600">Premium price locations</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {top.map((pred, index) => (
                        <div
                          key={pred.id}
                          onClick={() => toggleComparison(pred.grid_cell_id)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            selectedComparisons.includes(pred.grid_cell_id)
                              ? 'bg-amber-500 text-white shadow-lg scale-105'
                              : 'bg-white/60 hover:bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              selectedComparisons.includes(pred.grid_cell_id)
                                ? 'bg-white text-amber-600'
                                : 'bg-amber-500 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${
                                selectedComparisons.includes(pred.grid_cell_id) ? 'text-white' : 'text-gray-800'
                              }`}>{pred.grid_cell_id}</p>
                              <p className={`text-xs ${
                                selectedComparisons.includes(pred.grid_cell_id) ? 'text-amber-100' : 'text-gray-500'
                              }`}>Click to compare</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${
                            selectedComparisons.includes(pred.grid_cell_id) ? 'text-white' : 'text-amber-600'
                          }`}>{formatPriceShort(pred.predicted_price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom 5 Least Expensive */}
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 backdrop-blur-sm rounded-xl p-6 border-2 border-emerald-200">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <TrendingDown className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">💎 Top 5 Most Affordable</h3>
                        <p className="text-xs text-gray-600">Budget-friendly locations</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {bottom.map((pred, index) => (
                        <div
                          key={pred.id}
                          onClick={() => toggleComparison(pred.grid_cell_id)}
                          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                            selectedComparisons.includes(pred.grid_cell_id)
                              ? 'bg-emerald-500 text-white shadow-lg scale-105'
                              : 'bg-white/60 hover:bg-white hover:shadow-md'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              selectedComparisons.includes(pred.grid_cell_id)
                                ? 'bg-white text-emerald-600'
                                : 'bg-emerald-500 text-white'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${
                                selectedComparisons.includes(pred.grid_cell_id) ? 'text-white' : 'text-gray-800'
                              }`}>{pred.grid_cell_id}</p>
                              <p className={`text-xs ${
                                selectedComparisons.includes(pred.grid_cell_id) ? 'text-emerald-100' : 'text-gray-500'
                              }`}>Click to compare</p>
                            </div>
                          </div>
                          <p className={`text-lg font-bold ${
                            selectedComparisons.includes(pred.grid_cell_id) ? 'text-white' : 'text-emerald-600'
                          }`}>{formatPriceShort(pred.predicted_price)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Interactive Comparison Tool */}
                {comparedAreas.length > 0 && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-sm rounded-xl p-6 border-2 border-blue-200 animate-slide-up">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">⚖️ Area Comparison Tool</h3>
                          <p className="text-xs text-gray-600">Compare up to 3 selected areas</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedComparisons([])}
                        className="text-sm px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="grid gap-4">
                      {comparedAreas.map((pred) => {
                        const percentile = ((pred.predicted_price - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
                        const vsAvg = ((pred.predicted_price - (stats?.avg || 0)) / (stats?.avg || 1)) * 100;
                        return (
                          <div key={pred.id} className="bg-white/80 rounded-lg p-4 border-2 border-blue-300">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-lg ${getPriceColor(pred.predicted_price)} flex items-center justify-center shadow-md`}>
                                  <Grid3x3 className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-gray-800">{pred.grid_cell_id}</h4>
                                  <p className="text-2xl font-bold text-blue-600">{formatPriceShort(pred.predicted_price)}</p>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div className="text-center p-2 bg-purple-100 rounded-lg">
                                <p className="text-xs text-gray-600">Percentile</p>
                                <p className="text-lg font-bold text-purple-600">{percentile.toFixed(0)}th</p>
                              </div>
                              <div className="text-center p-2 bg-green-100 rounded-lg">
                                <p className="text-xs text-gray-600">vs Average</p>
                                <p className={`text-lg font-bold ${vsAvg >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {vsAvg >= 0 ? '+' : ''}{vsAvg.toFixed(1)}%
                                </p>
                              </div>
                              <div className="text-center p-2 bg-orange-100 rounded-lg">
                                <p className="text-xs text-gray-600">Full Price</p>
                                <p className="text-xs font-bold text-orange-600">{formatPrice(pred.predicted_price)}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm text-blue-800">
                        💡 <span className="font-semibold">Tip:</span> Click on areas in the Top/Bottom lists above to add them to comparison!
                      </p>
                    </div>
                  </div>
                )}

                {/* Price Insights */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 backdrop-blur-sm rounded-xl p-6 border-2 border-indigo-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">💡 Key Insights</h3>
                      <p className="text-xs text-gray-600">Automated analysis of your predictions</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white/60 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                        <p className="font-semibold text-gray-800">Price Spread</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        The price difference between highest and lowest is <span className="font-bold text-indigo-600">{formatPriceShort(priceRange.max - priceRange.min)}</span>, showing <span className="font-semibold">{((priceRange.max - priceRange.min) / priceRange.min * 100).toFixed(1)}%</span> variance.
                      </p>
                    </div>
                    <div className="bg-white/60 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-5 h-5 text-orange-600" />
                        <p className="font-semibold text-gray-800">Market Balance</p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {stats && Math.abs(stats.avg - stats.median) / stats.avg < 0.1
                          ? '✅ Prices are well-balanced with minimal outliers'
                          : '⚠️ Significant outliers detected in price distribution'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Grid Visualization */}
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Map className="w-5 h-5 text-blue-600" />
                  Interactive Price Heatmap
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <span className="px-2 py-1 bg-green-500 rounded">Low</span>
                  <span className="px-2 py-1 bg-yellow-500 rounded">Med</span>
                  <span className="px-2 py-1 bg-red-500 rounded">High</span>
                </div>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {predictions.map((pred, index) => {
                  const percentile = ((pred.predicted_price - priceRange.min) / (priceRange.max - priceRange.min)) * 100;
                  return (
                    <div
                      key={pred.id || index}
                      className="relative group cursor-pointer"
                    >
                      <div
                        className={`aspect-square rounded-lg ${getPriceColor(pred.predicted_price)} hover:scale-110 transition-all duration-200 shadow-md hover:shadow-2xl ring-2 ring-transparent hover:ring-white`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-br from-gray-900/95 to-blue-900/95 backdrop-blur-md rounded-lg z-10 -translate-y-1 group-hover:translate-y-0">
                        <div className="text-white text-center p-2">
                          <div className="flex items-center gap-1 justify-center mb-1">
                            <Grid3x3 className="w-3 h-3" />
                            <div className="text-xs font-bold">
                              {pred.grid_cell_id}
                            </div>
                          </div>
                          <div className="text-sm font-bold text-green-300 mb-1">
                            {formatPriceShort(pred.predicted_price)}
                          </div>
                          <div className="text-xs text-gray-300">
                            {percentile.toFixed(0)}th percentile
                          </div>
                          {pred.actual_price && (
                            <div className="text-xs mt-1 text-yellow-300 border-t border-white/20 pt-1">
                              Actual: {formatPriceShort(pred.actual_price)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm border-2 border-blue-200 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800 mb-2">📊 Grid Map Visualization</p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Each square represents a grid cell with predicted land prices. Colors range from <span className="font-semibold text-green-600">green (low)</span> to <span className="font-semibold text-red-600">red (high)</span>. Hover over cells to see detailed information including grid ID and exact price in INR.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedRun && !loading && (
          <div className="animate-slide-up">
            {modelRuns.length === 0 ? (
              <div className="bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-2xl p-10 border-2 border-dashed border-blue-300">
                <div className="text-center">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-2xl animate-glow" />
                    <Map className="w-20 h-20 text-blue-500 mx-auto relative" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">No Trained Models Yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto leading-relaxed">
                    Before you can visualize predictions, you need to train at least one model on your dataset.
                  </p>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 max-w-lg mx-auto">
                    <p className="font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                      <Play className="w-5 h-5 text-blue-600" />
                      Get Started in 3 Steps:
                    </p>
                    <div className="space-y-3 text-left">
                      <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <div>
                          <p className="font-medium text-gray-800">Upload Dataset</p>
                          <p className="text-sm text-gray-600">Go to Upload Data and add your land price data</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <div>
                          <p className="font-medium text-gray-800">Train Model</p>
                          <p className="text-sm text-gray-600">Visit Train Models and select an algorithm</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <div>
                          <p className="font-medium text-gray-800">View Predictions</p>
                          <p className="text-sm text-gray-600">Come back here to visualize the results</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/80 backdrop-blur-sm rounded-2xl p-10 border-2 border-dashed border-indigo-300 text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-2xl animate-pulse" />
                  <Filter className="w-16 h-16 text-indigo-500 mx-auto relative" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Select a Model to View Predictions</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Choose one of your {modelRuns.length} trained model{modelRuns.length > 1 ? 's' : ''} from the dropdown above to visualize predictions.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
