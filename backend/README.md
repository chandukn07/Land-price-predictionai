# Land Price Prediction ML Backend

Flask-based machine learning backend for land price prediction using ensemble models (Gradient Boosting, XGBoost, LightGBM, Random Forest) with SHAP interpretability.

## Features

- **Multiple ML Models**: Gradient Boosting, XGBoost, LightGBM, Random Forest
- **SHAP Analysis**: Model interpretability using SHAP values
- **Supabase Integration**: PostgreSQL database via Supabase
- **RESTful API**: Clean Flask endpoints for training, prediction, and analysis
- **Model Persistence**: Save and load trained models

## Tech Stack

- **Framework**: Flask 3.0
- **ML Libraries**: scikit-learn, XGBoost, LightGBM
- **Interpretability**: SHAP
- **Database**: Supabase (PostgreSQL)
- **Data Processing**: pandas, numpy

## Installation

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your_secret_key
```

## Running the Server

```bash
python app.py
```

Server will start on `http://127.0.0.1:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Training

**Start Training**
```
POST /api/training/start
Content-Type: application/json

{
  "model_run_id": "uuid",
  "dataset_id": "uuid",
  "model_type": "xgboost",
  "hyperparameters": {
    "n_estimators": 100,
    "learning_rate": 0.1,
    "max_depth": 6
  },
  "test_size": 0.2
}
```

**Get Training Status**
```
GET /api/training/status/<model_run_id>
```

### Prediction

**Make Predictions**
```
POST /api/prediction/predict
Content-Type: application/json

{
  "model_run_id": "uuid",
  "features": [
    {
      "grid_cell_id": "A1",
      "assessment_date": "2024-01-01",
      "building_density": 0.5,
      "population_density": 1000,
      ...
    }
  ]
}
```

**Batch Predictions**
```
POST /api/prediction/batch
Content-Type: application/json

{
  "model_run_id": "uuid",
  "dataset_id": "uuid"
}
```

### SHAP Analysis

**Analyze SHAP Values**
```
POST /api/shap/analyze
Content-Type: application/json

{
  "model_run_id": "uuid",
  "features": [...]
}
```

**Get Feature Importance**
```
GET /api/shap/importance/<model_run_id>
```

## Project Structure

```
backend/
├── app.py                  # Flask application factory
├── config.py              # Configuration
├── database.py            # Supabase client
├── requirements.txt       # Python dependencies
├── models/
│   ├── ml_models.py      # ML model training
│   └── shap_analyzer.py  # SHAP analysis
└── routes/
    ├── health.py         # Health check
    ├── training.py       # Training endpoints
    ├── prediction.py     # Prediction endpoints
    └── shap_analysis.py  # SHAP endpoints
```

## Model Types

- `gradient_boosting`: Scikit-learn Gradient Boosting
- `xgboost`: XGBoost Regressor
- `lightgbm`: LightGBM Regressor
- `random_forest`: Random Forest Regressor

## Features Used

The system uses 15 features for land price prediction:

1. `building_density`
2. `population_density`
3. `avg_building_height`
4. `commercial_ratio`
5. `residential_ratio`
6. `distance_to_station`
7. `distance_to_highway`
8. `distance_to_city_center`
9. `school_count`
10. `hospital_count`
11. `park_area`
12. `road_density`
13. `public_transport_access`
14. `crime_rate`
15. `employment_rate`

## Performance Metrics

The system calculates:
- **R² Score**: Coefficient of determination
- **RMSE**: Root Mean Squared Error
- **MAE**: Mean Absolute Error

## SHAP Integration

SHAP (SHapley Additive exPlanations) values are calculated during training to provide model interpretability. The system:
- Calculates SHAP values for all test samples
- Stores them in the database
- Provides aggregated feature importance
- Enables understanding of which features drive predictions

## Development

### Adding New Model Types

1. Import the model in `models/ml_models.py`
2. Add to `MODELS` dictionary
3. Add hyperparameter preparation in `_prepare_hyperparameters()`

### Database Schema

Ensure your Supabase database has these tables:
- `datasets`
- `features`
- `land_prices`
- `model_runs`
- `predictions`
- `shap_values`

## Troubleshooting

**Import Errors**: Ensure virtual environment is activated
**Database Errors**: Check Supabase credentials in `.env`
**Model Not Found**: Ensure model training completed successfully

## License

MIT
