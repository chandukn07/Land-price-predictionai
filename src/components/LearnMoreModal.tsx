import { X, Brain, TrendingUp, Map, BarChart3, Target, Zap, Sparkles, GitCompare, DollarSign, MapPin } from 'lucide-react';

interface LearnMoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LearnMoreModal({ isOpen, onClose }: LearnMoreModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-auto transform transition-all animate-in fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  🏡 Land Price Prediction System
                </h2>
                <p className="text-blue-100">
                  AI-Powered Real Estate Price Intelligence
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* What It Does */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-6 h-6 text-blue-600" />
                What Does This System Do?
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed">
                Our <span className="font-semibold text-blue-600">Land Price Prediction System</span> uses advanced machine learning algorithms to predict real estate prices across major Indian cities. By analyzing 15 key urban features, we provide accurate price estimates for land and properties.
              </p>
            </section>

            {/* Key Features */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                Key Features
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Multiple ML Models</h4>
                      <p className="text-sm text-gray-600">
                        XGBoost, LightGBM, Random Forest & Gradient Boosting for maximum accuracy
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-600 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">High Accuracy</h4>
                      <p className="text-sm text-gray-600">
                        Achieves 85-95% R² scores across different property types and locations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-600 rounded-lg">
                      <Map className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">Multi-City Coverage</h4>
                      <p className="text-sm text-gray-600">
                        Supports Mumbai, Delhi, Bangalore, Pune, Hyderabad & Chennai
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-orange-600 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-1">SHAP Analysis</h4>
                      <p className="text-sm text-gray-600">
                        Explainable AI showing which features impact prices the most
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* NEW FEATURES */}
            <section className="bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 p-6 rounded-xl border-2 border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-gray-800">✨ NEW! Unique Features</h3>
              </div>
              <p className="text-gray-600 mb-4">
                We've added <strong>exclusive features</strong> that no other real estate platform has!
              </p>

              <div className="space-y-4">
                {/* Feature 1: Location Search */}
                <div className="bg-white p-5 rounded-xl border-2 border-green-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        ⚡ Instant Location Search
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Just type any location name - we'll instantly predict the price!
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-700 ml-14">
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span><strong>Smart Autocomplete</strong> - Google Maps powered suggestions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span><strong>Auto-Extract 15 Features</strong> - Schools, hospitals, transport, density, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span><strong>2-4 Second Response</strong> - Instant ML prediction with pre-trained models</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-600 font-bold mt-0.5">✓</span>
                      <span><strong>No Manual Data Entry</strong> - Everything is automatic!</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 2: Comparison */}
                <div className="bg-white p-5 rounded-xl border-2 border-purple-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                      <GitCompare className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        🎯 Location Comparison Mode
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Compare up to 3 locations side-by-side with ML predictions!
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-700 ml-14">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-0.5">✓</span>
                      <span><strong>Best Value Badge</strong> - Highlights cheapest option in green</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-0.5">✓</span>
                      <span><strong>Premium Badge</strong> - Shows most expensive in purple</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-0.5">✓</span>
                      <span><strong>Feature Comparison</strong> - Award icons (⭐) for best in each category</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 font-bold mt-0.5">✓</span>
                      <span><strong>Quick Insights</strong> - See price difference % instantly</span>
                    </li>
                  </ul>
                </div>

                {/* Feature 3: Investment Analysis */}
                <div className="bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-800 mb-1">
                        💰 AI Investment Score & ROI Calculator
                      </h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Get professional investment analysis with multi-year ROI projections!
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-1.5 text-sm text-gray-700 ml-14">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span><strong>Investment Score (0-100)</strong> - 5-factor analysis: Connectivity, Amenities, Infrastructure, Livability, Growth</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span><strong>Letter Grade (A+ to D)</strong> - Easy-to-understand investment quality</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span><strong>ROI Projections</strong> - 1 year, 3 years, and 5 years future value</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span><strong>Rental Yield</strong> - Estimated annual rental return %</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span><strong>Risk Assessment</strong> - Low/Moderate/High with reasoning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold mt-0.5">✓</span>
                      <span><strong>5 AI Insights</strong> - Key factors affecting investment potential</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-800 font-semibold mb-1">
                  🚀 Why This Is Unique:
                </p>
                <p className="text-xs text-gray-700">
                  No other platform (Zillow, MagicBricks, 99acres) combines <strong>real-time ML predictions</strong> + <strong>auto-feature extraction</strong> + <strong>location comparison</strong> + <strong>AI investment scoring</strong>. You're using the most advanced real estate prediction tool! 🎉
                </p>
              </div>
            </section>

            {/* How It Works */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">How It Works</h3>
              
              {/* Quick Mode */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
                <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  ⚡ Quick Mode (New!)
                </h4>
                <p className="text-sm text-gray-700">
                  Just go to <strong>"⚡ Location Search"</strong> → Type any location → Get instant prediction in 2-4 seconds!
                  <br />
                  <span className="text-xs text-gray-600 italic">No data upload or training needed - uses pre-trained models!</span>
                </p>
              </div>

              {/* Advanced Mode */}
              <h4 className="font-semibold text-gray-700 mb-3">Advanced Mode (Custom Training):</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Upload Data</h4>
                    <p className="text-gray-600 text-sm">
                      Upload land price datasets with 15 urban features (building density, population, transport access, etc.)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Train Models</h4>
                    <p className="text-gray-600 text-sm">
                      Select from multiple ML algorithms and train on your data to learn price patterns
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-1">Analyze & Predict</h4>
                    <p className="text-gray-600 text-sm">
                      View performance metrics, SHAP analysis, and make accurate price predictions
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Key Insights */}
            <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100">
              <h3 className="text-xl font-bold text-gray-800 mb-3">💡 Key Insights</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Predicts prices in <strong>INR (Indian Rupees)</strong> for Indian real estate market</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Handles price ranges from <strong>₹3.2L to ₹2.4Cr</strong> across different property types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Uses <strong>15 urban features</strong> including density, infrastructure, and amenities</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">✓</span>
                  <span>Provides <strong>explainable predictions</strong> through SHAP feature importance analysis</span>
                </li>
              </ul>
            </section>

            {/* Use Cases */}
            <section>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">🎯 Perfect For</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Real Estate Agents', 'Property Investors', 'Urban Planners', 'Financial Analysts', 'Research & Academia', 'Government Bodies'].map((useCase) => (
                  <div key={useCase} className="bg-white border-2 border-gray-200 p-3 rounded-lg text-center hover:border-blue-400 hover:shadow-md transition-all">
                    <span className="text-sm font-medium text-gray-700">{useCase}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 rounded-b-2xl border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Powered by <span className="font-semibold">Machine Learning & AI</span>
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
