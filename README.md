# 🏞️ Land Price Prediction System

A full-stack machine learning application for land price prediction using ensemble models with SHAP interpretability analysis. Built with React + TypeScript frontend and Flask + ML backend with **SQLite database** (no external dependencies required!).

## 🚀 Quick Start Guide

### Prerequisites

Before running this project, ensure you have:

- **Node.js** 18+ and npm installed
- **Python** 3.9+ installed (with pip)
- **That's it!** No external database setup required 🎉

## 📦 Installation & Setup

### 1. Clone and Navigate to Project

```bash
# If cloning from repository
git clone <your-repo-url>
cd project

# Or if you already have the project
cd c:\Users\TheActivist\Desktop\Land\project-bolt-sb1-9wdcnggy\project
```

### 2. Frontend Setup (React + TypeScript + Vite)

```bash
# Install frontend dependencies
npm install
```

Create a `.env` file in the project root (optional - has fallback defaults):

```env
VITE_API_URL=http://127.0.0.1:5000/api
# Note: Supabase env vars are optional - using local SQLite database
VITE_SUPABASE_URL=your_supabase_url_if_needed  
VITE_SUPABASE_ANON_KEY=your_supabase_key_if_needed
```

### 3. Backend Setup (Flask + ML + SQLite) - NO VIRTUAL ENVIRONMENT

Navigate to the backend directory:

```bash
cd backend
```

Install Python dependencies globally:

```bash
# Install all required packages
pip install Flask==3.0.0
pip install Flask-CORS==4.0.0
pip install scikit-learn==1.3.2
pip install xgboost==2.0.3
pip install lightgbm==4.1.0
pip install shap==0.44.0
pip install pandas==2.1.4
pip install numpy==1.26.2
pip install SQLAlchemy==2.0.23
pip install python-dotenv==1.0.0
pip install joblib==1.3.2
pip install python-dateutil==2.8.2

# Or install all at once from requirements.txt
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory (optional - has defaults):

```env
SECRET_KEY=your_secret_key_here
FLASK_DEBUG=True
HOST=127.0.0.1
PORT=5000
```

### 4. Database Setup - **AUTOMATIC!** 🎉

**No manual database setup required!** The SQLite database will be automatically created when you first run the backend:

- Database file: `backend/land_price_prediction.db`
- All tables created automatically using SQLAlchemy
- No external database service needed
- Zero configuration required!

## 🎯 Running the Application

### Method 1: Using Batch File (Windows - Recommended)

**Start Backend:**
```bash
cd backend
run.bat
```

**Start Frontend (in a new terminal):**
```bash
cd c:\Users\TheActivist\Desktop\Land\project-bolt-sb1-9wdcnggy\project
npm run dev
```

### Method 2: Manual Commands

**Start Backend (Terminal 1):**
```bash
cd backend
python app.py
```

**Start Frontend (Terminal 2):**
```bash
# From project root
npm run dev
```

### Access the Application

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://127.0.0.1:5000`
- **Health Check**: `http://127.0.0.1:5000/api/health`
- **SQLite Database**: `backend/land_price_prediction.db` (auto-created)

### 🎯 What Happens on First Run

When you start the backend for the first time:

1. **SQLite Database Creation**: `land_price_prediction.db` file is automatically created in the `backend/` folder
2. **Table Generation**: All required tables are created using SQLAlchemy:
   - `datasets` - Dataset information
   - `features` - Land feature data (15 characteristics)
   - `land_prices` - Price target values
   - `grid_cells` - Geographic grid references
   - `model_runs` - ML training sessions
   - `predictions` - Model predictions
   - `shap_values` - SHAP interpretability data
3. **Ready to Use**: No manual database setup required!

## 🏗️ Project Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  React Frontend │────▶ │   Flask Backend  │────▶ │   SQLite DB     │
│  (Port 5173)    │      │   (Port 5000)    │      │   (Local File)  │
│                 │      │                  │      │                 │
│ • Data Upload   │      │ • Model Training │      │ • datasets      │
│ • Training UI   │      │ • XGBoost        │      │ • features      │
│ • Predictions   │      │ • LightGBM       │      │ • land_prices   │
│ • SHAP Analysis │      │ • Random Forest  │      │ • model_runs    │
│ • Metrics       │      │ • Grad Boosting  │      │ • predictions   │
│                 │      │ • SHAP Analysis  │      │ • shap_values   │
│                 │      │ • SQLAlchemy ORM │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
```

## 🔧 Core Features

### 🤖 Machine Learning Models
- **Gradient Boosting** (scikit-learn)
- **XGBoost** - High-performance gradient boosting
- **LightGBM** - Fast gradient boosting framework
- **Random Forest** - Ensemble learning method

### 📊 Model Interpretability
- **SHAP (SHapley Additive exPlanations)**
  - Feature importance analysis
  - Individual prediction explanations
  - Global feature impact visualization

### 📈 Land Price Features (15 total)
1. **Building Density** - Buildings per area unit
2. **Population Density** - People per area unit
3. **Average Building Height** - Mean height of structures
4. **Commercial Ratio** - Commercial vs total area
5. **Residential Ratio** - Residential vs total area
6. **Distance to Station** - Proximity to transport hubs
7. **Distance to Highway** - Accessibility to major roads
8. **Distance to City Center** - Urban center proximity
9. **School Count** - Number of educational institutions
10. **Hospital Count** - Healthcare facility availability
11. **Park Area** - Green space availability
12. **Road Density** - Road network density
13. **Public Transport Access** - Transit accessibility score
14. **Crime Rate** - Safety index
15. **Employment Rate** - Economic activity level

### 📏 Performance Metrics
- **R² Score** - Coefficient of determination
- **RMSE** - Root Mean Squared Error
- **MAE** - Mean Absolute Error

## 🧪 Testing the System

### Step 1: Upload Sample Data
1. Navigate to **"Upload Data"** tab
2. Upload CSV/JSON files with feature data
3. Upload corresponding land price data
4. Verify data appears in **"Datasets"** tab

### Step 2: Train a Model
1. Go to **"Train Models"** tab
2. Select your uploaded dataset
3. Choose model type (recommended: XGBoost)
4. Adjust hyperparameters if needed
5. Click **"Start Training"**
6. Monitor progress in real-time

### Step 3: Analyze Results
- **Predictions Tab**: Visualize predicted vs actual prices
- **SHAP Analysis Tab**: Explore feature importance
- **Performance Tab**: Compare model metrics

## 📁 Detailed Project Structure

```
project/
├── 📱 Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── DatasetList.tsx     # Dataset management
│   │   │   ├── DataUpload.tsx      # File upload interface
│   │   │   ├── ModelTraining.tsx   # ML training interface
│   │   │   ├── PredictionMap.tsx   # Prediction visualization
│   │   │   ├── ShapAnalysis.tsx    # SHAP interpretability
│   │   │   └── PerformanceMetrics.tsx # Model evaluation
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Database client
│   │   │   └── api.ts              # Backend API client
│   │   ├── utils/
│   │   │   └── dataProcessing.ts   # Data transformation utilities
│   │   └── types/
│   │       └── index.ts            # TypeScript type definitions
│   ├── package.json             # Frontend dependencies
│   └── vite.config.ts          # Vite configuration
│
├── 🧠 Backend (Flask + ML + SQLite)
│   ├── app.py                  # Main Flask application
│   ├── config.py               # App configuration
│   ├── database.py             # SQLite connection & SQLAlchemy setup
│   ├── requirements.txt        # Python dependencies
│   ├── run.bat                 # Windows startup script
│   ├── land_price_prediction.db # SQLite database (auto-created)
│   ├── models/
│   │   ├── ml_models.py        # ML model implementations
│   │   ├── shap_analyzer.py    # SHAP analysis logic
│   │   └── database_models.py  # SQLAlchemy ORM models
│   └── routes/
│       ├── health.py           # Health check endpoint
│       ├── training.py         # Model training endpoints
│       ├── prediction.py       # Prediction endpoints
│       └── shap_analysis.py    # SHAP analysis endpoints
│
└── 📖 Documentation
    ├── README.md               # This file
    ├── SETUP_GUIDE.md         # Detailed setup guide
    └── SQLITE_MIGRATION.md    # Database migration guide
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env) - Optional:**
```env
VITE_API_URL=http://127.0.0.1:5000/api
# Supabase vars below are legacy - not required for SQLite setup
VITE_SUPABASE_URL=optional_if_using_hybrid_setup
VITE_SUPABASE_ANON_KEY=optional_if_using_hybrid_setup
```

**Backend (backend/.env) - Optional:**
```env
SECRET_KEY=change-this-in-production
FLASK_DEBUG=True
HOST=127.0.0.1
PORT=5000
# No database credentials needed - using local SQLite!
```

## 🐛 Troubleshooting

### Common Issues & Solutions

#### ❌ Backend Won't Start
**Problem**: Python packages not found
**Solution**: 
```bash
pip install -r backend/requirements.txt
python --version  # Ensure Python 3.9+
```

#### ❌ Frontend Can't Connect to Backend
**Problem**: CORS or connection errors
**Solutions**:
- Ensure backend is running on port 5000
- Check `VITE_API_URL` in frontend `.env`
- Verify no firewall blocking port 5000

#### ❌ Database Connection Failed
**Problem**: SQLite database issues
**Solutions**:
- Check if `backend/land_price_prediction.db` file was created
- Verify SQLAlchemy installation: `pip show SQLAlchemy`
- Ensure backend directory has write permissions
- Delete `land_price_prediction.db` and restart backend to recreate

#### ❌ Model Training Fails
**Problem**: Insufficient data or missing features
**Solutions**:
- Ensure minimum 10 data samples
- Verify all 15 features are present
- Check backend logs for detailed errors

#### ❌ SHAP Analysis Not Working
**Problem**: Model not trained or missing files
**Solutions**:
- Complete model training first
- Check `backend/models/` directory exists
- Verify model file was saved successfully

### Debug Commands

**Check Python packages:**
```bash
pip list | findstr -i "flask sklearn xgboost lightgbm sqlalchemy"
```

**Check SQLite database:**
```bash
# Navigate to backend folder
cd backend
# Check if database file exists
dir land_price_prediction.db
```

**Test backend health:**
```bash
curl http://127.0.0.1:5000/api/health
```

**Check frontend build:**
```bash
npm run build
```

## 📊 API Documentation

### 🏥 Health Check
```http
GET /api/health
Response: {"status": "healthy", "timestamp": "..."}
```

### 🚀 Start Model Training
```http
POST /api/training/start
Content-Type: application/json

{
  "model_run_id": "uuid-here",
  "dataset_id": "uuid-here",
  "model_type": "xgboost",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 6,
    "learning_rate": 0.1
  },
  "test_size": 0.2
}
```

### 🔮 Make Predictions
```http
POST /api/prediction/predict
Content-Type: application/json

{
  "model_run_id": "uuid-here",
  "features": [
    {
      "building_density": 0.75,
      "population_density": 1200,
      "avg_building_height": 15.5,
      // ... other 12 features
    }
  ]
}
```

### 📈 Get SHAP Feature Importance
```http
GET /api/shap/importance/{model_run_id}
Response: {
  "feature_importance": [
    {"feature": "distance_to_station", "importance": 0.25},
    {"feature": "building_density", "importance": 0.18},
    // ... other features
  ]
}
```

## 🚀 Deployment Guide

### Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to Vercel/Netlify/Similar
# Upload 'dist' folder contents
```

### Backend Deployment
```bash
# For production, use Gunicorn
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:create_app()

# SQLite database file will be created on first run
# Ensure the deployment environment has write permissions
# Deploy to Railway/Render/Heroku with SQLite support
```

## 📝 Data Format Requirements

### Features CSV Format
```csv
grid_cell_id,assessment_date,building_density,population_density,avg_building_height,commercial_ratio,residential_ratio,distance_to_station,distance_to_highway,distance_to_city_center,school_count,hospital_count,park_area,road_density,public_transport_access,crime_rate,employment_rate
GRID001,2023-01-01,0.75,1200,15.5,0.3,0.6,2.1,5.2,8.3,3,1,120.5,0.8,0.9,0.15,0.85
GRID002,2023-01-01,0.68,980,12.3,0.25,0.65,3.2,4.1,6.7,2,2,95.2,0.75,0.85,0.12,0.92
```

### Land Prices CSV Format
```csv
grid_cell_id,assessment_date,price
GRID001,2023-01-01,450000
GRID002,2023-01-01,380000
```

## 🏆 Project Highlights

- ✅ **No Virtual Environment Required** - Direct pip installation
- ✅ **No External Database Setup** - SQLite auto-created locally
- ✅ **Zero Configuration** - Works out of the box
- ✅ **Real-time Model Training** - Live progress updates
- ✅ **Advanced ML Models** - XGBoost, LightGBM, Random Forest
- ✅ **Model Interpretability** - SHAP analysis integration
- ✅ **Modern UI** - React + TypeScript + Tailwind CSS
- ✅ **Local Database** - SQLite with SQLAlchemy ORM
- ✅ **RESTful API** - Clean Flask backend architecture
- ✅ **Performance Metrics** - Comprehensive model evaluation
- ✅ **Interactive Visualizations** - Maps and charts
- ✅ **Easy Deployment** - Ready for production
- ✅ **Self-Contained** - No external dependencies or accounts needed

## 📞 Support

If you encounter any issues:

1. **Check the Console**: Frontend (F12) and Backend terminal logs
2. **Verify Prerequisites**: Python 3.9+, Node 18+, Supabase setup
3. **Test Connectivity**: Health endpoint and database connection
4. **Review Configuration**: Environment variables and file paths

## 📄 License

MIT License - Feel free to use and modify as needed!

---

**🎉 Happy Land Price Predicting! 🎉**