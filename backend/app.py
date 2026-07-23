from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
import os

# Import blueprints
from routes.training import training_bp
from routes.prediction import prediction_bp
from routes.shap_analysis import shap_bp
from routes.health import health_bp
from routes.house_prices import house_prices_bp
from routes.datasets import datasets_bp
from routes.model_runs import model_runs_bp
from routes.location_prediction import location_prediction_bp

def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:5173", "http://localhost:3000"],
            "methods": ["GET", "POST", "PUT", "DELETE"],
            "allow_headers": ["Content-Type"]
        }
    })
    
    # Create model storage directory if it doesn't exist
    os.makedirs(Config.MODEL_STORAGE_PATH, exist_ok=True)
    
    # Register blueprints
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(datasets_bp, url_prefix='/api/datasets')
    app.register_blueprint(model_runs_bp, url_prefix='/api/model_runs')
    app.register_blueprint(training_bp, url_prefix='/api/training')
    app.register_blueprint(prediction_bp, url_prefix='/api/prediction')
    app.register_blueprint(shap_bp, url_prefix='/api/shap')
    app.register_blueprint(house_prices_bp, url_prefix='/api/house_prices')
    app.register_blueprint(location_prediction_bp, url_prefix='/api/location')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal server error'}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
