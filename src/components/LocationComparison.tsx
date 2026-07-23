import { useState } from 'react';
import { 
  MapPin, 
  Search, 
  X,
  Loader2,
  TrendingUp,
  Award,
  AlertCircle,
  Plus,
  Trash2,
  Crown,
  Target,
  DollarSign
} from 'lucide-react';
import { apiClient } from '../lib/api';

interface LocationData {
  id: string;
  location: string;
  predicted_price: number;
  price_range: {
    lower: number;
    upper: number;
  };
  location_info: {
    formatted_address: string;
    latitude: number;
    longitude: number;
    city: string;
  };
  features_extracted: Record<string, number>;
  model_info: {
    model_type: string;
    r2_score: number;
  };
}

interface LocationSuggestion {
  description: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
}

export function LocationComparison() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setLoading(true);
      const response = await apiClient.autocompleteLocation(input);
      setSuggestions(response.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Autocomplete error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setLocationInput(value);
    const timer = setTimeout(() => fetchSuggestions(value), 500);
    return () => clearTimeout(timer);
  };

  const addLocation = async (locationText: string) => {
    if (locations.length >= 3) {
      setError('Maximum 3 locations can be compared');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.predictByLocation(locationText);
      
      const newLocation: LocationData = {
        id: Date.now().toString(),
        location: locationText,
        ...response
      };

      setLocations([...locations, newLocation]);
      setLocationInput('');
      setShowSuggestions(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add location');
    } finally {
      setLoading(false);
    }
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const clearAll = () => {
    setLocations([]);
    setError(null);
  };

  const formatCrores = (amount: number) => {
    const crores = amount / 10000000;
    if (crores >= 1) {
      return `₹${crores.toFixed(2)} Cr`;
    }
    const lakhs = amount / 100000;
    return `₹${lakhs.toFixed(2)} L`;
  };

  const getBestLocation = (metric: keyof LocationData['features_extracted']) => {
    if (locations.length === 0) return null;
    
    // For distances, lower is better
    const distanceMetrics = ['distance_to_station', 'distance_to_highway', 'distance_to_city_center', 'crime_rate'];
    const isLowerBetter = distanceMetrics.includes(metric);

    return locations.reduce((best, current) => {
      const currentValue = current.features_extracted[metric] || 0;
      const bestValue = best.features_extracted[metric] || 0;
      
      if (isLowerBetter) {
        return currentValue < bestValue ? current : best;
      }
      return currentValue > bestValue ? current : best;
    });
  };

  const getCheapestLocation = () => {
    if (locations.length === 0) return null;
    return locations.reduce((cheapest, current) => 
      current.predicted_price < cheapest.predicted_price ? current : cheapest
    );
  };

  const getMostExpensive = () => {
    if (locations.length === 0) return null;
    return locations.reduce((expensive, current) => 
      current.predicted_price > expensive.predicted_price ? current : expensive
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
            <Target className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">Location Comparison</h2>
            <p className="opacity-90 mt-1">Compare up to 3 locations side-by-side</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70" />
            <input
              type="text"
              value={locationInput}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Add location to compare..."
              className="w-full pl-12 pr-4 py-4 rounded-xl bg-white/20 backdrop-blur-sm border-2 border-white/30 focus:border-white focus:ring-4 focus:ring-white/20 transition-all text-lg text-white placeholder-white/60"
              disabled={loading || locations.length >= 3}
            />
            {loading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin" />
            )}
          </div>

          {/* Autocomplete */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  onClick={() => {
                    addLocation(suggestion.description);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-purple-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-0"
                >
                  <MapPin className="w-5 h-5 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-gray-900">{suggestion.main_text}</div>
                    <div className="text-sm text-gray-500">{suggestion.secondary_text}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="opacity-90">
            {locations.length}/3 locations added
          </div>
          {locations.length > 0 && (
            <button
              onClick={clearAll}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-red-800">{error}</div>
        </div>
      )}

      {/* Empty State */}
      {locations.length === 0 && (
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
          <Plus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700 mb-2">No Locations Added Yet</h3>
          <p className="text-gray-600">
            Start by searching and adding locations above to compare them
          </p>
        </div>
      )}

      {/* Comparison Table */}
      {locations.length > 0 && (
        <div className="space-y-6">
          {/* Price Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {locations.map((location, index) => {
              const isCheapest = getCheapestLocation()?.id === location.id && locations.length > 1;
              const isMostExpensive = getMostExpensive()?.id === location.id && locations.length > 1;

              return (
                <div
                  key={location.id}
                  className={`relative rounded-2xl shadow-xl p-6 transition-all ${
                    isCheapest
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white ring-4 ring-green-300'
                      : isMostExpensive
                      ? 'bg-gradient-to-br from-orange-500 to-red-600 text-white ring-4 ring-orange-300'
                      : 'bg-white border-2 border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className={`w-5 h-5 ${isCheapest || isMostExpensive ? 'text-white' : 'text-purple-500'}`} />
                      <span className="font-semibold text-sm">Location {index + 1}</span>
                    </div>
                    <button
                      onClick={() => removeLocation(location.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isCheapest || isMostExpensive
                          ? 'hover:bg-white/20'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Badge */}
                  {isCheapest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                      <Crown className="w-4 h-4" />
                      Best Value
                    </div>
                  )}
                  {isMostExpensive && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-400 text-purple-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                      <Award className="w-4 h-4" />
                      Premium
                    </div>
                  )}

                  {/* Location Name */}
                  <div className={`mb-4 ${isCheapest || isMostExpensive ? 'text-white' : 'text-gray-900'}`}>
                    <div className="font-bold text-lg mb-1">
                      {location.location_info.formatted_address.split(',')[0]}
                    </div>
                    <div className={`text-sm ${isCheapest || isMostExpensive ? 'opacity-90' : 'text-gray-600'}`}>
                      {location.location_info.city}
                    </div>
                  </div>

                  {/* Price */}
                  <div className={`mb-4 p-4 rounded-xl ${
                    isCheapest || isMostExpensive ? 'bg-white/20 backdrop-blur-sm' : 'bg-gradient-to-br from-purple-50 to-pink-50'
                  }`}>
                    <div className={`text-sm mb-1 ${isCheapest || isMostExpensive ? 'opacity-90' : 'text-gray-600'}`}>
                      Predicted Price
                    </div>
                    <div className={`text-3xl font-bold ${isCheapest || isMostExpensive ? 'text-white' : 'text-purple-600'}`}>
                      {formatCrores(location.predicted_price)}
                    </div>
                    <div className={`text-xs mt-1 ${isCheapest || isMostExpensive ? 'opacity-75' : 'text-gray-500'}`}>
                      Range: {formatCrores(location.price_range.lower)} - {formatCrores(location.price_range.upper)}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-2">
                    <MetricRow
                      label="Schools Nearby"
                      value={`${location.features_extracted.school_count}`}
                      isBest={getBestLocation('school_count')?.id === location.id}
                      isWhite={isCheapest || isMostExpensive}
                    />
                    <MetricRow
                      label="Distance to Station"
                      value={`${location.features_extracted.distance_to_station.toFixed(1)} km`}
                      isBest={getBestLocation('distance_to_station')?.id === location.id}
                      isWhite={isCheapest || isMostExpensive}
                    />
                    <MetricRow
                      label="Commercial Area"
                      value={`${(location.features_extracted.commercial_ratio * 100).toFixed(0)}%`}
                      isBest={getBestLocation('commercial_ratio')?.id === location.id}
                      isWhite={isCheapest || isMostExpensive}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Insights */}
          {locations.length > 1 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Quick Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InsightCard
                  icon={<DollarSign className="w-5 h-5 text-green-600" />}
                  title="Best Value"
                  value={getCheapestLocation()?.location_info.formatted_address.split(',')[0] || 'N/A'}
                  subtitle={`${formatCrores(getCheapestLocation()?.predicted_price || 0)}`}
                  color="green"
                />
                <InsightCard
                  icon={<Award className="w-5 h-5 text-purple-600" />}
                  title="Premium Location"
                  value={getMostExpensive()?.location_info.formatted_address.split(',')[0] || 'N/A'}
                  subtitle={`${formatCrores(getMostExpensive()?.predicted_price || 0)}`}
                  color="purple"
                />
              </div>

              {locations.length === 3 && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <div className="text-sm text-gray-700">
                    <strong>Price Difference:</strong> The most expensive location is{' '}
                    <span className="font-bold text-purple-600">
                      {(((getMostExpensive()?.predicted_price || 0) / (getCheapestLocation()?.predicted_price || 1) - 1) * 100).toFixed(0)}%
                    </span>{' '}
                    more expensive than the cheapest option.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface MetricRowProps {
  label: string;
  value: string;
  isBest: boolean;
  isWhite: boolean;
}

function MetricRow({ label, value, isBest, isWhite }: MetricRowProps) {
  return (
    <div className={`flex items-center justify-between text-sm ${isWhite ? 'text-white' : 'text-gray-700'}`}>
      <span className={isWhite ? 'opacity-90' : 'text-gray-600'}>{label}</span>
      <span className={`font-semibold ${isBest ? 'flex items-center gap-1' : ''}`}>
        {value}
        {isBest && <Award className="w-3 h-3 text-yellow-400" />}
      </span>
    </div>
  );
}

interface InsightCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'green' | 'purple';
}

function InsightCard({ icon, title, value, subtitle, color }: InsightCardProps) {
  return (
    <div className={`p-4 rounded-xl ${color === 'green' ? 'bg-green-50' : 'bg-purple-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
      <div className={`font-bold text-lg ${color === 'green' ? 'text-green-700' : 'text-purple-700'}`}>
        {value}
      </div>
      <div className="text-sm text-gray-600 mt-1">{subtitle}</div>
    </div>
  );
}
