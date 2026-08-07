import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

      if (!data.gridCells || !data.landPrices || !data.features) {
        throw new Error('Invalid data format. Expected gridCells, landPrices, and features arrays.');
      }

      setUploadStatus({ status: 'uploading', message: 'Creating dataset record...' });

      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .insert({
          name: datasetName,
          description: datasetDescription,
          status: 'processing'
        })
        .select()
        .single();

      if (datasetError) throw datasetError;

      setUploadStatus({ status: 'uploading', message: 'Uploading grid cells...' });

      const { error: gridError } = await supabase
        .from('grid_cells')
        .upsert(data.gridCells, { onConflict: 'grid_code' });

      if (gridError) throw gridError;

      const { data: insertedGrids } = await supabase
        .from('grid_cells')
        .select('id, grid_code');

      const gridCodeToId = new Map(
        insertedGrids?.map(g => [g.grid_code, g.id]) || []
      );

      setUploadStatus({ status: 'uploading', message: 'Uploading land prices...' });

      const landPricesWithIds = data.landPrices.map((lp: any) => ({
        ...lp,
        grid_cell_id: gridCodeToId.get(lp.grid_code) || lp.grid_cell_id
      }));

      const { error: priceError } = await supabase
        .from('land_prices')
        .insert(landPricesWithIds);

      if (priceError) throw priceError;

      setUploadStatus({ status: 'uploading', message: 'Uploading features...' });

      const featuresWithIds = data.features.map((f: any) => ({
        ...f,
        grid_cell_id: gridCodeToId.get(f.grid_code) || f.grid_cell_id
      }));

      const { error: featuresError } = await supabase
        .from('features')
        .insert(featuresWithIds);

      if (featuresError) throw featuresError;

      const dates = [
        ...data.landPrices.map((lp: any) => lp.assessment_date),
        ...data.features.map((f: any) => f.assessment_date)
      ].sort();

      await supabase
        .from('datasets')
        .update({
          status: 'ready',
          record_count: data.landPrices.length,
          date_range_start: dates[0],
          date_range_end: dates[dates.length - 1]
        })
        .eq('id', dataset.id);

      setUploadStatus({
        status: 'success',
        message: 'Data uploaded successfully!',
        details: {
          gridCells: data.gridCells.length,
          landPrices: data.landPrices.length,
          features: data.features.length
        }
      });

      setDatasetName('');
      setDatasetDescription('');
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus({
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to upload data'
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-800">Upload Dataset</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dataset Name *
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Tokyo Land Prices 2023"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={datasetDescription}
            onChange={(e) => setDatasetDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Describe the dataset..."
            rows={3}
          />
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            disabled={uploadStatus.status === 'uploading'}
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-sm text-gray-500">JSON file with gridCells, landPrices, and features</p>
          </label>
        </div>

        {uploadStatus.status !== 'idle' && (
          <div className={`p-4 rounded-lg flex items-start gap-3 ${
            uploadStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
            uploadStatus.status === 'error' ? 'bg-red-50 border border-red-200' :
            'bg-blue-50 border border-blue-200'
          }`}>
            {uploadStatus.status === 'success' && <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />}
            {uploadStatus.status === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
            {uploadStatus.status === 'uploading' && (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={`font-medium ${
                uploadStatus.status === 'success' ? 'text-green-800' :
                uploadStatus.status === 'error' ? 'text-red-800' :
                'text-blue-800'
              }`}>
                {uploadStatus.message}
              </p>
              {uploadStatus.details && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Grid Cells: {uploadStatus.details.gridCells}</p>
                  <p>Land Prices: {uploadStatus.details.landPrices}</p>
                  <p>Features: {uploadStatus.details.features}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">Expected JSON Format:</p>
          <pre className="bg-white p-3 rounded border border-gray-200 overflow-x-auto text-xs">
{`{
  "gridCells": [
    {
      "grid_code": "A001",
      "latitude": 35.6762,
      "longitude": 139.6503,
      "region": "Tokyo"
    }
  ],
  "landPrices": [
    {
      "grid_code": "A001",
      "price": 1000000,
      "assessment_date": "2023-01-01",
      "year": 2023,
      "quarter": 1
    }
  ],
  "features": [
    {
      "grid_code": "A001",
      "assessment_date": "2023-01-01",
      "building_density": 0.75,
      "population_density": 15000,
      ...
    }
  ]
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
