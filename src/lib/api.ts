/**
 * API client for Flask ML Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export interface TrainingRequest {
  model_run_id: string;
  dataset_id: string;
  model_type: string;
  hyperparameters: Record<string, any>;
  test_size: number;
}

export interface PredictionRequest {
  model_run_id: string;
  features: Record<string, any>[];
}

export interface ShapAnalysisRequest {
  model_run_id: string;
  features: Record<string, any>[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/health`);
    if (!response.ok) {
      throw new Error('Backend health check failed');
    }
    return response.json();
  }

  /**
   * Start model training
   */
  async startTraining(request: TrainingRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/training/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Training failed');
    }

    return response.json();
  }

  /**
   * Get training status
   */
  async getTrainingStatus(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/training/status/${modelRunId}`);
    if (!response.ok) {
      throw new Error('Failed to get training status');
    }
    return response.json();
  }

  /**
   * Make predictions
   */
  async predict(request: PredictionRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/prediction/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Batch predictions
   */
  async batchPredict(modelRunId: string, datasetId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/prediction/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_run_id: modelRunId,
        dataset_id: datasetId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Batch prediction failed');
    }

    return response.json();
  }

  /**
   * Generate predictions for a model run
   */
  async generatePredictions(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/prediction/generate/${modelRunId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate predictions');
    }

    return response.json();
  }

  /**
   * Get predictions for a model run
   */
  async getPredictions(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/prediction/model_run/${modelRunId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch predictions');
    }
    return response.json();
  }

  /**
   * Analyze SHAP values
   */
  async analyzeShap(request: ShapAnalysisRequest): Promise<any> {
    const response = await fetch(`${this.baseUrl}/shap/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'SHAP analysis failed');
    }

    return response.json();
  }

  /**
   * Generate SHAP values for a model run
   */
  async generateShapValues(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/shap/generate/${modelRunId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate SHAP values');
    }

    return response.json();
  }

  /**
   * Get feature importance
   */
  async getFeatureImportance(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/shap/importance/${modelRunId}`);
    if (!response.ok) {
      throw new Error('Failed to get feature importance');
    }
    return response.json();
  }

  /**
   * Get all datasets
   */
  async getDatasets(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/datasets/`);
    if (!response.ok) {
      throw new Error('Failed to fetch datasets');
    }
    return response.json();
  }

  /**
   * Get a specific dataset
   */
  async getDataset(datasetId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch dataset');
    }
    return response.json();
  }

  /**
   * Upload dataset
   */
  async uploadDataset(name: string, description: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/datasets/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description,
        data,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Dataset upload failed');
    }

    return response.json();
  }

  /**
   * Delete dataset
   */
  async deleteDataset(datasetId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/datasets/${datasetId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete dataset');
    }

    return response.json();
  }

  /**
   * Get all model runs
   */
  async getModelRuns(filters?: { limit?: number; status?: string; dataset_id?: string }): Promise<any> {
    const params = new URLSearchParams();
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);
    if (filters?.dataset_id) params.append('dataset_id', filters.dataset_id);

    const url = `${this.baseUrl}/model_runs/${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch model runs');
    }
    return response.json();
  }

  /**
   * Get a specific model run
   */
  async getModelRun(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/model_runs/${modelRunId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch model run');
    }
    return response.json();
  }

  /**
   * Create model run
   */
  async createModelRun(modelType: string, datasetId: string, hyperparameters: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}/model_runs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model_type: modelType,
        dataset_id: datasetId,
        hyperparameters,
        status: 'pending',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create model run');
    }

    return response.json();
  }

  /**
   * Delete model run
   */
  async deleteModelRun(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/model_runs/${modelRunId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete model run');
    }

    return response.json();
  }

  /**
   * Predict price by location (NEW - Location-based prediction)
   */
  async predictByLocation(location: string, modelRunId?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/location/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location,
        model_run_id: modelRunId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Location prediction failed');
    }

    return response.json();
  }

  /**
   * Get location autocomplete suggestions
   */
  async autocompleteLocation(input: string, latitude?: number, longitude?: number): Promise<any> {
    const params = new URLSearchParams({ input });
    if (latitude !== undefined) params.append('latitude', latitude.toString());
    if (longitude !== undefined) params.append('longitude', longitude.toString());

    const response = await fetch(`${this.baseUrl}/location/autocomplete?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Autocomplete failed');
    }

    return response.json();
  }

  /**
   * Batch predict prices for multiple locations
   */
  async batchPredictLocations(locations: string[], modelRunId?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/location/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations,
        model_run_id: modelRunId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Batch location prediction failed');
    }

    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
