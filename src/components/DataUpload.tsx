import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../lib/api';

interface UploadStatus {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
  details?: {
    gridCells: number;
    landPrices: number;
    features: number;
  };
}

export function DataUpload() {
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
    status: 'idle',
    message: ''
  });
  const [datasetName, setDatasetName] = useState('');
  const [datasetDescription, setDatasetDescription] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!datasetName.trim()) {
      setUploadStatus({
        status: 'error',
        message: 'Please provide a dataset name'
      });
      return;
    }

    setUploadStatus({ status: 'uploading', message: 'Processing file...' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.features || !data.prices) {
        throw new Error('Invalid data format. Expected features and prices arrays.');
      }

      setUploadStatus({ status: 'uploading', message: 'Uploading dataset...' });

      // Upload to backend API
      const result = await apiClient.uploadDataset(
        datasetName,
        datasetDescription,
        data
      );

      setUploadStatus({
        status: 'success',
        message: 'Data uploaded successfully!',
        details: {
          gridCells: 0,
          landPrices: result.prices_count || 0,
          features: result.features_count || 0
        }
      });

      setDatasetName('');
      setDatasetDescription('');

      // Refresh the page or trigger a dataset list refresh
      window.dispatchEvent(new Event('datasetUploaded'));
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload data'
      });
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transform hover:scale-[1.01] transition-all duration-300 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg animate-float">
          <Upload className="w-7 h-7 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Upload Dataset</h2>
          <p className="text-sm text-gray-500 mt-1">Add new training data to your collection</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full group-hover:animate-pulse" />
            Dataset Name *
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full px-5 py-3.5 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md placeholder:text-gray-400"
            placeholder="e.g., Mumbai Bandra Properties 2023"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full group-hover:animate-pulse" />
            Description
          </label>
          <textarea
            value={datasetDescription}
            onChange={(e) => setDatasetDescription(e.target.value)}
            className="w-full px-5 py-3.5 bg-white/70 backdrop-blur-sm border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 h-28 resize-none shadow-sm hover:shadow-md placeholder:text-gray-400"
            placeholder="Describe the dataset characteristics, location, time period..."
          />
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-100" />
          <div className="relative border-2 border-dashed border-gray-300 bg-gradient-to-br from-blue-50/30 to-purple-50/30 backdrop-blur-sm rounded-2xl p-10 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-300 group-hover:shadow-xl">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              disabled={uploadStatus.status === 'uploading'}
            />
            <label htmlFor="file-upload" className="cursor-pointer block">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-xl animate-glow" />
                <FileText className="w-16 h-16 text-blue-500 mx-auto relative group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-blue-600 transition-colors">
                Click to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">
                JSON file with features and prices • INR values expected
              </p>
            </label>
          </div>
        </div>

        {uploadStatus.status !== 'idle' && (
          <div className={`p-5 rounded-xl backdrop-blur-sm flex items-start gap-4 animate-slide-up shadow-lg border-2 ${
            uploadStatus.status === 'success' ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 border-green-300' :
            uploadStatus.status === 'error' ? 'bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-300' :
            'bg-gradient-to-br from-blue-50/80 to-indigo-50/80 border-blue-300'
          }`}>
            {uploadStatus.status === 'success' && (
              <div className="p-2 bg-green-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 animate-scale-in" />
              </div>
            )}
            {uploadStatus.status === 'error' && (
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600 animate-scale-in" />
              </div>
            )}
            {uploadStatus.status === 'uploading' && (
              <div className="relative p-2">
                <div className="w-6 h-6 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              </div>
            )}
            <div className="flex-1">
              <p className={`font-semibold text-lg ${
                uploadStatus.status === 'success' ? 'text-green-800' :
                uploadStatus.status === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {uploadStatus.message}
              </p>
              {uploadStatus.details && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">Features</p>
                    <p className="text-lg font-bold text-gray-800">{uploadStatus.details.features}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">Prices</p>
                    <p className="text-lg font-bold text-gray-800">{uploadStatus.details.landPrices}</p>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500 mb-1">Cells</p>
                    <p className="text-lg font-bold text-gray-800">{uploadStatus.details.gridCells}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Expected JSON Format:</p>
          <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs">
{`{
  "features": [
    {
      "grid_cell_id": "A001",
      "assessment_date": "2023-01-01",
      "building_density": 0.75,
      "population_density": 15000,
      "avg_building_height": 25.5,
      "commercial_ratio": 0.3,
      "residential_ratio": 0.7,
      "distance_to_station": 0.5,
      "distance_to_highway": 2.0,
      "distance_to_city_center": 5.0,
      "school_count": 3,
      "hospital_count": 2,
      "park_area": 1000.0,
      "road_density": 0.6,
      "public_transport_access": 0.8,
      "crime_rate": 0.05,
      "employment_rate": 0.92
    }
  ],
  "prices": [
    {
      "grid_cell_id": "A001",
      "assessment_date": "2023-01-01",
      "price": 1000000
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
