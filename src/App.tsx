import { useState } from 'react';
import {
  Database,
  Upload,
  Brain,
  Map,
  BarChart3,
  Activity,
  Menu,
  X
} from 'lucide-react';
import { DatasetList } from './components/DatasetList';
import { DataUpload } from './components/DataUpload';
import { ModelTraining } from './components/ModelTraining';
import { PredictionMap } from './components/PredictionMap';
import { ShapAnalysis } from './components/ShapAnalysis';
import { PerformanceMetrics } from './components/PerformanceMetrics';

type Tab =
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
  { id: 'datasets', label: 'Datasets', icon: <Database className="w-5 h-5" /> },
  { id: 'upload', label: 'Upload Data', icon: <Upload className="w-5 h-5" /> },
  { id: 'train', label: 'Train Models', icon: <Brain className="w-5 h-5" /> },
  { id: 'predictions', label: 'Predictions', icon: <Map className="w-5 h-5" /> },
  { id: 'shap', label: 'SHAP Analysis', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'metrics', label: 'Performance', icon: <Activity className="w-5 h-5" /> }
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('datasets');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
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
        return <DatasetList />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Map className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Land Price Prediction System
                </h1>
                <p className="text-xs text-gray-500">
                  Ensemble ML with SHAP Analysis
                </p>
              </div>
            </div>

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
            className={`lg:w-64 ${
              mobileMenuOpen ? 'block' : 'hidden lg:block'
            }`}
          >
            <nav className="bg-white rounded-lg shadow-md p-4 space-y-2 sticky top-24">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                    activeTab === item.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          <main className="flex-1">{renderContent()}</main>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p className="mb-2">
              Land Price Prediction System - Ensemble Machine Learning Platform
            </p>
            <p className="text-xs text-gray-500">
              Supports Gradient Boosting, XGBoost, LightGBM, and Random Forest
              with SHAP interpretability
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
