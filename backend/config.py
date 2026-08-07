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
