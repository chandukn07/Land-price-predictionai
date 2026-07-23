import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Application configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True') == 'True'
    
    # Server
    HOST = os.getenv('HOST', '127.0.0.1')
    PORT = int(os.getenv('PORT', 5000))
    
    # Model Storage
    MODEL_STORAGE_PATH = os.path.join(os.path.dirname(__file__), 'models')
    
    # Training
    RANDOM_STATE = 42
    MAX_WORKERS = 4
    
    # Google Maps API
    GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'AIzaSyCXMuWvccDLIA4PFfjcxgvloZcQrPDDfL4')
    
    # Feature Extraction
    FEATURE_CACHE_DURATION = 3600  # 1 hour cache for API results
    DEFAULT_SEARCH_RADIUS = 2000  # 2km radius for nearby places
