export interface GridCell {
  id: string;
  grid_code: string;
  latitude: number;
  longitude: number;
  geometry?: string;
  region?: string;
  created_at: string;
}

export interface LandPrice {
  id: string;
  grid_cell_id: string;
  price: number;
  price_per_sqm?: number;
  assessment_date: string;
  year: number;
  quarter?: number;
  currency: string;
  created_at: string;
}

export interface Features {
  id: string;
  grid_cell_id: string;
  assessment_date: string;
  building_density?: number;
  population_density?: number;
  avg_building_height?: number;
  commercial_ratio?: number;
  residential_ratio?: number;
  distance_to_station?: number;
  distance_to_highway?: number;
  distance_to_city_center?: number;
  school_count?: number;
  hospital_count?: number;
  park_area?: number;
  road_density?: number;
  public_transport_access?: number;
  crime_rate?: number;
  employment_rate?: number;
  additional_features?: Record<string, any>;
  created_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  description?: string;
  uploaded_by?: string;
  upload_date: string;
  record_count: number;
  date_range_start?: string;
  date_range_end?: string;
  status: 'uploaded' | 'processing' | 'ready' | 'error';
  created_at: string;
}

export type ModelType = 'gradient_boosting' | 'xgboost' | 'lightgbm' | 'random_forest' | 'svm';

export interface ModelRun {
  id: string;
  model_type: ModelType;
  dataset_id?: string;
  hyperparameters: Record<string, any>;
  train_date_start?: string;
  train_date_end?: string;
  test_date_start?: string;
  test_date_end?: string;
  train_size?: number;
  test_size?: number;
  feature_count?: number;
  selected_features?: string[];
  status: 'pending' | 'training' | 'completed' | 'failed';
  r2_score?: number;
  rmse?: number;
  mae?: number;
  training_time_seconds?: number;
  created_at: string;
  completed_at?: string;
}

export interface Prediction {
  id: string;
  model_run_id: string;
  grid_cell_id: string;
  prediction_date: string;
  predicted_price: number;
  actual_price?: number;
  prediction_error?: number;
  confidence_interval_lower?: number;
  confidence_interval_upper?: number;
  created_at: string;
}

export interface ShapValue {
  id: string;
  model_run_id: string;
  grid_cell_id?: string;
  feature_name: string;
  shap_value: number;
  feature_value?: number;
  is_global: boolean;
  created_at: string;
}

export interface DataUpload {
  gridCells: Omit<GridCell, 'id' | 'created_at'>[];
  landPrices: Omit<LandPrice, 'id' | 'created_at'>[];
  features: Omit<Features, 'id' | 'created_at'>[];
}

export interface ModelConfig {
  model_type: ModelType;
  train_test_split: number;
  date_split?: {
    train_start: string;
    train_end: string;
    test_start: string;
    test_end: string;
  };
  hyperparameters: Record<string, any>;
  selected_features: string[];
}

export interface PerformanceMetrics {
  r2_score: number;
  rmse: number;
  mae: number;
  training_time: number;
}
