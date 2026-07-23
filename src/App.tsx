import { useState } from 'react';
import {
  Database,
  Upload,
  Brain,
  Map,
  BarChart3,
  Activity,
  Menu,
  X,
  HelpCircle,
  Sparkles,
  MapPin,
  GitCompare
} from 'lucide-react';
import { DatasetList } from './components/DatasetList';
import { DataUpload } from './components/DataUpload';
import { ModelTraining } from './components/ModelTraining';
import { PredictionMap } from './components/PredictionMap';
import { ShapAnalysis } from './components/ShapAnalysis';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { LearnMoreModal } from './components/LearnMoreModal';
import { LocationSearch } from './components/LocationSearch';
import { LocationComparison } from './components/LocationComparison';

type Tab =
  | 'location'
  | 'comparison'
  | 'datasets'
  | 'upload'
  | 'train'
  | 'predictions'
  | 'shap'
  | 'metrics';

interface NavItem {
  id: Tab;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'location', label: '⚡ Location Search', icon: <MapPin className="w-5 h-5" /> },
  { id: 'comparison', label: '🎯 Compare Locations', icon: <GitCompare className="w-5 h-5" /> },
  { id: 'datasets', label: 'Datasets', icon: <Database className="w-5 h-5" /> },
  { id: 'upload', label: 'Upload Data', icon: <Upload className="w-5 h-5" /> },
  { id: 'train', label: 'Train Models', icon: <Brain className="w-5 h-5" /> },
  { id: 'predictions', label: 'Predictions', icon: <Map className="w-5 h-5" /> },
  { id: 'shap', label: 'SHAP Analysis', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'metrics', label: 'Performance', icon: <Activity className="w-5 h-5" /> }
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('location');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [learnMoreOpen, setLearnMoreOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'location':
        return <LocationSearch />;
      case 'comparison':
        return <LocationComparison />;
      case 'datasets':
        return <DatasetList />;
      case 'upload':
        return <DataUpload />;
      case 'train':
        return <ModelTraining />;
      case 'predictions':
        return <PredictionMap />;
      case 'shap':
        return <ShapAnalysis />;
      case 'metrics':
        return <PerformanceMetrics />;
      default:
        return <LocationSearch />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 relative">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <header className="bg-white/80 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-600 p-2.5 rounded-xl shadow-lg">
                <Map className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Land Price Prediction System
                </h1>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-Powered Real Estate Intelligence
                </p>
              </div>
            </div>

            {/* Learn More Button */}
            <button
              onClick={() => setLearnMoreOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 font-medium hover:scale-105 transform"
            >
              <HelpCircle className="w-4 h-4" />
              Learn More
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside
            className={`lg:w-64 relative z-10 ${
              mobileMenuOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <nav className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl p-4 space-y-2 sticky top-24 border border-gray-200">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:scale-102 transform'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1 relative z-10">{renderContent()}</main>
        </div>
      </div>

      <footer className="bg-white/80 backdrop-blur-md border-t border-gray-200 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-base font-semibold text-gray-800 mb-2">
              🏡 Land Price Prediction System
            </p>
            <p className="text-sm text-gray-600 mb-3">
              AI-Powered Ensemble Machine Learning Platform for Indian Real Estate
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supports XGBoost, LightGBM, Random Forest & Gradient Boosting with SHAP Interpretability
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">All Prices in INR</span>
              <button
                onClick={() => setLearnMoreOpen(true)}
                className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-xs font-medium hover:shadow-md transition-all"
              >
                <HelpCircle className="w-3 h-3 inline mr-1" />
                Learn More
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Learn More Modal */}
      <LearnMoreModal isOpen={learnMoreOpen} onClose={() => setLearnMoreOpen(false)} />
    </div>
  );
}

export default App;
