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
   * Get feature importance
   */
  async getFeatureImportance(modelRunId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/shap/importance/${modelRunId}`);
    if (!response.ok) {
      throw new Error('Failed to get feature importance');
    }
    return response.json();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
