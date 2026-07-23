# Land Price Prediction System - Complete Setup Guide

A full-stack machine learning application for land price prediction using ensemble models with SHAP interpretability.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+
- **Supabase Account** (free tier works)

## 📦 Installation

### 1. Frontend Setup (React + TypeScript + Vite)

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://127.0.0.1:5000/api
```

### 2. Backend Setup (Flask + ML)

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Or on macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `backend/.env` with your configuration:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
SECRET_KEY=your_secret_key_here
FLASK_DEBUG=True
HOST=127.0.0.1
PORT=5000
```

### 3. Database Setup (Supabase)

Create the following tables in your Supabase project:

#### **datasets**
```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  record_count INTEGER,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **features**
```sql
CREATE TABLE features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id),
  grid_cell_id TEXT NOT NULL,
  assessment_date DATE NOT NULL,
  building_density NUMERIC,
  population_density NUMERIC,
  avg_building_height NUMERIC,
  commercial_ratio NUMERIC,
  residential_ratio NUMERIC,
  distance_to_station NUMERIC,
  distance_to_highway NUMERIC,
  distance_to_city_center NUMERIC,
  school_count INTEGER,
  hospital_count INTEGER,
  park_area NUMERIC,
  road_density NUMERIC,
  public_transport_access NUMERIC,
  crime_rate NUMERIC,
  employment_rate NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **land_prices**
```sql
CREATE TABLE land_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id UUID REFERENCES datasets(id),
  grid_cell_id TEXT NOT NULL,
  assessment_date DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **grid_cells**
```sql
CREATE TABLE grid_cells (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grid_code TEXT UNIQUE NOT NULL,
  latitude NUMERIC,
  longitude NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **model_runs**
```sql
CREATE TABLE model_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_type TEXT NOT NULL,
  dataset_id UUID REFERENCES datasets(id),
  hyperparameters JSONB,
  status TEXT DEFAULT 'pending',
  r2_score NUMERIC,
  rmse NUMERIC,
  mae NUMERIC,
  train_samples INTEGER,
  test_samples INTEGER,
  model_path TEXT,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **predictions**
```sql
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_run_id UUID REFERENCES model_runs(id),
  grid_cell_id TEXT,
  prediction_date DATE,
  predicted_price NUMERIC NOT NULL,
  actual_price NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### **shap_values**
```sql
CREATE TABLE shap_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  model_run_id UUID REFERENCES model_runs(id),
  feature_name TEXT NOT NULL,
  shap_value NUMERIC NOT NULL,
  grid_cell_id TEXT,
  prediction_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎯 Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
venv\Scripts\activate    # Windows
# source venv/bin/activate  # macOS/Linux

python app.py
```

Backend will run on `http://127.0.0.1:5000`

### Start Frontend (Terminal 2)

```bash
# From project root
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📚 Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  React Frontend │─────▶│   Flask Backend  │─────▶│   Supabase DB   │
│  (Port 5173)    │      │   (Port 5000)    │      │   (PostgreSQL)  │
│                 │      │                  │      │                 │
│ - Data Upload   │      │ - Model Training │      │ - datasets      │
│ - Training UI   │      │ - XGBoost        │      │ - features      │
│ - Predictions   │      │ - LightGBM       │      │ - land_prices   │
│ - SHAP Analysis │      │ - Random Forest  │      │ - model_runs    │
│ - Metrics       │      │ - Grad Boosting  │      │ - predictions   │
│                 │      │ - SHAP Analysis  │      │ - shap_values   │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## 🔧 Key Features

### Machine Learning Models
- **Gradient Boosting** (scikit-learn)
- **XGBoost**
- **LightGBM**
- **Random Forest**

### Model Interpretability
- **SHAP (SHapley Additive exPlanations)**
  - Feature importance
  - Individual prediction explanations
  - Aggregate analysis

### Features (15 total)
1. Building Density
2. Population Density
3. Average Building Height
4. Commercial Ratio
5. Residential Ratio
6. Distance to Station
7. Distance to Highway
8. Distance to City Center
9. School Count
10. Hospital Count
11. Park Area
12. Road Density
13. Public Transport Access
14. Crime Rate
15. Employment Rate

### Performance Metrics
- R² Score
- RMSE (Root Mean Squared Error)
- MAE (Mean Absolute Error)

## 🧪 Testing the System

### 1. Upload Sample Data
- Navigate to "Upload Data" tab
- Upload CSV/JSON with feature data
- Upload corresponding land prices

### 2. Train a Model
- Go to "Train Models" tab
- Select a dataset
- Choose model type (e.g., XGBoost)
- Adjust hyperparameters
- Click "Start Training"

### 3. View Results
- **Predictions**: Grid visualization of predicted prices
- **SHAP Analysis**: Feature importance charts
- **Performance**: Model metrics and comparisons

## 📁 Project Structure

```
project/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── DatasetList.tsx
│   │   ├── DataUpload.tsx
│   │   ├── ModelTraining.tsx   # Integrated with Flask
│   │   ├── PredictionMap.tsx
│   │   ├── ShapAnalysis.tsx
│   │   └── PerformanceMetrics.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   └── api.ts              # Flask API client
│   ├── utils/
│   │   └── dataProcessing.ts   # Data utilities
│   └── types/                   # TypeScript types
│
├── backend/                      # Flask ML backend
│   ├── app.py                   # Flask app
│   ├── config.py                # Configuration
│   ├── database.py              # Supabase client
│   ├── models/
│   │   ├── ml_models.py        # ML model trainers
│   │   └── shap_analyzer.py    # SHAP analysis
│   ├── routes/
│   │   ├── health.py           # Health check
│   │   ├── training.py         # Training endpoints
│   │   ├── prediction.py       # Prediction endpoints
│   │   └── shap_analysis.py    # SHAP endpoints
│   └── requirements.txt         # Python dependencies
│
└── SETUP_GUIDE.md               # This file
```

## 🐛 Troubleshooting

### Backend Won't Start
- Check Python version: `python --version` (needs 3.9+)
- Activate virtual environment
- Reinstall dependencies: `pip install -r requirements.txt`
- Check Supabase credentials in `.env`

### Frontend Can't Connect to Backend
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Verify CORS settings in `backend/app.py`

### Model Training Fails
- Check Supabase tables exist
- Verify dataset has both features and land_prices
- Check backend logs for detailed errors
- Ensure enough data (minimum 10 samples)

### SHAP Analysis Not Working
- Verify model training completed successfully
- Check SHAP values were calculated and stored
- Ensure model file exists in `backend/models/`

## 📖 API Documentation

### Health Check
```http
GET /api/health
```

### Start Training
```http
POST /api/training/start
Content-Type: application/json

{
  "model_run_id": "uuid",
  "dataset_id": "uuid",
  "model_type": "xgboost",
  "hyperparameters": {...},
  "test_size": 0.2
}
```

### Make Predictions
```http
POST /api/prediction/predict
Content-Type: application/json

{
  "model_run_id": "uuid",
  "features": [...]
}
```

### Get SHAP Importance
```http
GET /api/shap/importance/{model_run_id}
```

## 🚀 Production Deployment

### Frontend
- Build: `npm run build`
- Deploy to Vercel, Netlify, or similar

### Backend
- Use Gunicorn: `gunicorn -w 4 app:app`
- Deploy to Railway, Render, or AWS
- Set environment variables
- Ensure model storage directory persists

## 📝 License

MIT

## 🤝 Support

For issues or questions, check the backend logs and frontend console for detailed error messages.
