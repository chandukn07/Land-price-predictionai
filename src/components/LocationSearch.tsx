import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  TrendingUp, 
  Info, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Navigation,
  Building2,
  Train,
  School,
  Cross,
  Trees,
  Activity
} from 'lucide-react';
import { apiClient } from '../lib/api';

interface LocationSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

interface PredictionResult {
  predicted_price: number;
  price_range: {
    lower: number;
    upper: number;
    confidence: string;
  };
  location_info: {
    input: string;
    formatted_address: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  features_extracted: Record<string, number>;
  model_info: {
    model_id: string;
    model_type: string;
    r2_score: number;
    rmse: number;
    mae: number;
  };
  investment_analysis: {
    overall_score: number;
    grade: string;
    breakdown: {
      connectivity: number;
      amenities: number;
      infrastructure: number;
      livability: number;
      growth_potential: number;
    };
    roi_projections: {
      '1_year': number;
      '3_years': number;
      '5_years': number;
    };
    rental_yield: number;
    risk_level: string;
    insights: string[];
  };
}

export function LocationSearch() {
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounced autocomplete
  useEffect(() => {
    if (locationInput.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await apiClient.autocompleteLocation(locationInput);
        setSuggestions(response.suggestions || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error('Autocomplete error:', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [locationInput]);

  const handlePrediction = async (location: string) => {
    try {
      setPredicting(true);
      setError(null);
      setResult(null);

      const response = await apiClient.predictByLocation(location);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setPredicting(false);
    }
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    setLocationInput(suggestion.description);
    setShowSuggestions(false);
    handlePrediction(suggestion.description);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locationInput.trim()) {
      setShowSuggestions(false);
      handlePrediction(locationInput);
    }
  };

  const formatLakhs = (amount: number) => {
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} Lakhs`;
  };

  const formatCrores = (amount: number) => {
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    return formatLakhs(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-gray-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-lg">
            <MapPin className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Instant Location Search
            </h2>
            <p className="text-gray-600 mt-1">
              ⚡ Enter any location to get instant land price prediction
            </p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              placeholder="Try: Bandra West Mumbai, Koramangala Bangalore, etc..."
              className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all text-lg"
              disabled={predicting}
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 animate-spin" />
            )}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`w-full text-left px-4 py-3 hover:bg-green-50 transition-colors flex items-start gap-3 ${
                    index !== suggestions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <MapPin className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.main_text}</div>
                    <div className="text-sm text-gray-500">{suggestion.secondary_text}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={predicting || !locationInput.trim()}
            className="mt-4 w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {predicting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing Location...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Predict Land Price
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-800">Prediction Error</div>
            <div className="text-red-600 text-sm mt-1">{error}</div>
          </div>
        </div>
      )}

      {/* Prediction Result */}
      {result && (
        <div className="space-y-6">
          {/* Main Result Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-6 h-6" />
              <span className="font-semibold">Prediction Complete</span>
            </div>
            
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-2">
                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                <div>
                  <div className="text-sm opacity-90">Location</div>
                  <div className="font-semibold text-lg">{result.location_info.formatted_address}</div>
                </div>
              </div>
            </div>

            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-4">
              <div className="text-sm opacity-90 mb-2">Predicted Land Price</div>
              <div className="text-5xl font-bold mb-2">{formatCrores(result.predicted_price)}</div>
              <div className="text-sm opacity-90">
                Range: {formatCrores(result.price_range.lower)} - {formatCrores(result.price_range.upper)}
              </div>
              <div className="text-xs opacity-75 mt-2">
                {result.price_range.confidence} confidence interval
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="opacity-75 mb-1">Model Used</div>
                <div className="font-semibold capitalize">{result.model_info.model_type}</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="opacity-75 mb-1">Accuracy (R²)</div>
                <div className="font-semibold">{(result.model_info.r2_score * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          {/* Investment Score & ROI */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-8 h-8" />
              <div>
                <h3 className="text-2xl font-bold">Investment Analysis</h3>
                <p className="text-sm opacity-90">AI-powered investment score & ROI projections</p>
              </div>
            </div>

            {/* Overall Score */}
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm opacity-90 mb-1">Investment Score</div>
                  <div className="text-6xl font-bold">{result.investment_analysis.overall_score}</div>
                  <div className="text-sm opacity-75 mt-1">out of 100</div>
                </div>
                <div className="text-center">
                  <div className={`text-5xl font-bold px-6 py-3 rounded-xl ${
                    result.investment_analysis.grade.startsWith('A') ? 'bg-green-500' :
                    result.investment_analysis.grade.startsWith('B') ? 'bg-blue-500' :
                    'bg-yellow-500'
                  }`}>
                    {result.investment_analysis.grade}
                  </div>
                  <div className="text-xs opacity-75 mt-2">Investment Grade</div>
                </div>
              </div>
              
              {/* Risk Level */}
              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <span className="text-sm opacity-90">Risk Level</span>
                <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
                  result.investment_analysis.risk_level === 'Low' ? 'bg-green-500' :
                  result.investment_analysis.risk_level === 'Moderate' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}>
                  {result.investment_analysis.risk_level}
                </span>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
              <ScoreCard label="Connectivity" score={result.investment_analysis.breakdown.connectivity} />
              <ScoreCard label="Amenities" score={result.investment_analysis.breakdown.amenities} />
              <ScoreCard label="Infrastructure" score={result.investment_analysis.breakdown.infrastructure} />
              <ScoreCard label="Livability" score={result.investment_analysis.breakdown.livability} />
              <ScoreCard label="Growth" score={result.investment_analysis.breakdown.growth_potential} />
            </div>

            {/* ROI Projections */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                ROI Projections
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <ROICard 
                  period="1 Year" 
                  roi={result.investment_analysis.roi_projections['1_year']}
                  price={result.predicted_price}
                />
                <ROICard 
                  period="3 Years" 
                  roi={result.investment_analysis.roi_projections['3_years']}
                  price={result.predicted_price}
                />
                <ROICard 
                  period="5 Years" 
                  roi={result.investment_analysis.roi_projections['5_years']}
                  price={result.predicted_price}
                />
              </div>
            </div>

            {/* Rental Yield */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-90">Estimated Rental Yield</span>
                <span className="text-2xl font-bold">{result.investment_analysis.rental_yield}%</span>
              </div>
              <div className="text-xs opacity-75 mt-1">per annum</div>
            </div>

            {/* Key Insights */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h4 className="font-bold mb-3">🔍 Key Insights</h4>
              <ul className="space-y-2">
                {result.investment_analysis.insights.map((insight, index) => (
                  <li key={index} className="text-sm opacity-90 flex items-start gap-2">
                    <span className="text-yellow-300">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Features Extracted */}
          <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800">Location Features Analyzed</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Distance Features */}
              <FeatureCard
                icon={<Train className="w-5 h-5 text-blue-500" />}
                label="Distance to Station"
                value={`${result.features_extracted.distance_to_station.toFixed(2)} km`}
              />
              <FeatureCard
                icon={<Building2 className="w-5 h-5 text-purple-500" />}
                label="Distance to City Center"
                value={`${result.features_extracted.distance_to_city_center.toFixed(2)} km`}
              />
              <FeatureCard
                icon={<Activity className="w-5 h-5 text-orange-500" />}
                label="Distance to Highway"
                value={`${result.features_extracted.distance_to_highway.toFixed(2)} km`}
              />

              {/* Count Features */}
              <FeatureCard
                icon={<School className="w-5 h-5 text-green-500" />}
                label="Schools Nearby"
                value={`${result.features_extracted.school_count} schools`}
              />
              <FeatureCard
                icon={<Cross className="w-5 h-5 text-red-500" />}
                label="Hospitals Nearby"
                value={`${result.features_extracted.hospital_count} hospitals`}
              />
              <FeatureCard
                icon={<Trees className="w-5 h-5 text-emerald-500" />}
                label="Park Area"
                value={`${(result.features_extracted.park_area * 100).toFixed(0)}%`}
              />

              {/* Density Features */}
              <FeatureCard
                icon={<Building2 className="w-5 h-5 text-gray-600" />}
                label="Building Density"
                value={`${(result.features_extracted.building_density * 100).toFixed(0)}%`}
              />
              <FeatureCard
                icon={<Activity className="w-5 h-5 text-indigo-500" />}
                label="Population Density"
                value={`${(result.features_extracted.population_density * 100).toFixed(0)}%`}
              />
              <FeatureCard
                icon={<TrendingUp className="w-5 h-5 text-cyan-500" />}
                label="Commercial Ratio"
                value={`${(result.features_extracted.commercial_ratio * 100).toFixed(0)}%`}
              />
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-2 text-sm text-blue-800">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <strong>How it works:</strong> We automatically extracted {Object.keys(result.features_extracted).length} features 
                  from this location using Google Maps API and fed them into our trained ML model to predict the land price.
                </div>
              </div>
            </div>
          </div>

          {/* Model Performance Info */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Model Performance Metrics
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {(result.model_info.r2_score * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">R² Score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {formatCrores(result.model_info.rmse)}
                </div>
                <div className="text-sm text-gray-600 mt-1">RMSE</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {formatCrores(result.model_info.mae)}
                </div>
                <div className="text-sm text-gray-600 mt-1">MAE</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* How it Works Info */}
      {!result && !predicting && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-lg p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-600" />
            How Instant Prediction Works
          </h3>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start gap-3">
              <div className="bg-amber-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-amber-800">
                1
              </div>
              <div>
                <div className="font-semibold">Enter Location</div>
                <div className="text-sm text-gray-600">Type any address in India with autocomplete suggestions</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-amber-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-amber-800">
                2
              </div>
              <div>
                <div className="font-semibold">Auto-Extract Features</div>
                <div className="text-sm text-gray-600">
                  We fetch 15 real estate features (schools, hospitals, transport, density, etc.) using Google Maps API
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-amber-200 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-amber-800">
                3
              </div>
              <div>
                <div className="font-semibold">ML Prediction</div>
                <div className="text-sm text-gray-600">
                  Pre-trained model analyzes features and predicts price instantly (no training needed!)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function FeatureCard({ icon, label, value }: FeatureCardProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <div className="text-sm font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-lg font-bold text-gray-800">{value}</div>
    </div>
  );
}

interface ScoreCardProps {
  label: string;
  score: number;
}

function ScoreCard({ label, score }: ScoreCardProps) {
  const getColor = (score: number) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-blue-500';
    if (score >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="text-center">
      <div className={`${getColor(score)} rounded-lg p-3 mb-2`}>
        <div className="text-2xl font-bold">{score}</div>
      </div>
      <div className="text-xs opacity-90">{label}</div>
    </div>
  );
}

interface ROICardProps {
  period: string;
  roi: number;
  price: number;
}

function ROICard({ period, roi, price }: ROICardProps) {
  const formatCrores = (amount: number) => {
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  };

  const futurePrice = price * (1 + roi / 100);

  return (
    <div className="text-center">
      <div className="text-sm opacity-75 mb-1">{period}</div>
      <div className="text-3xl font-bold text-green-300">+{roi.toFixed(1)}%</div>
      <div className="text-xs opacity-75 mt-1">{formatCrores(futurePrice)}</div>
    </div>
  );
}
