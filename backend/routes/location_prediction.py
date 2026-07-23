"""
Location-based prediction route
Accepts location string, extracts features, and returns price prediction
"""

from flask import Blueprint, request, jsonify
from database import db_session
from models.ml_models import ModelTrainer
from models.database_models import ModelRun
from utils.geocoding_service import GeocodingService
from utils.feature_extraction_service import FeatureExtractionService
from utils.investment_analyzer import InvestmentAnalyzer
import numpy as np
import traceback
import logging

logger = logging.getLogger(__name__)

location_prediction_bp = Blueprint('location_prediction', __name__)

FEATURE_COLUMNS = [
    'building_density',
    'population_density',
    'avg_building_height',
    'commercial_ratio',
    'residential_ratio',
    'distance_to_station',
    'distance_to_highway',
    'distance_to_city_center',
    'school_count',
    'hospital_count',
    'park_area',
    'road_density',
    'public_transport_access',
    'crime_rate',
    'employment_rate'
]


@location_prediction_bp.route('/predict', methods=['POST'])
def predict_by_location():
    """
    Predict land price based on location string
    
    Expected JSON:
    {
        "location": "Bandra West, Mumbai",
        "model_run_id": "uuid" (optional - uses best model if not provided)
    }
    
    Returns:
    {
        "predicted_price": 25000000,
        "location_info": {...},
        "features_extracted": {...},
        "model_info": {...}
    }
    """
    try:
        data = request.get_json()
        
        location = data.get('location')
        model_run_id = data.get('model_run_id')
        
        if not location:
            return jsonify({'error': 'Location is required'}), 400
        
        # Step 1: Geocode the location
        logger.info(f"Geocoding location: {location}")
        geocoding_service = GeocodingService()
        geo_result = geocoding_service.geocode_location(location)
        
        if not geo_result:
            return jsonify({'error': f'Could not find location: {location}'}), 404
        
        latitude = geo_result['latitude']
        longitude = geo_result['longitude']
        
        # Step 2: Extract features
        logger.info(f"Extracting features for coordinates: ({latitude}, {longitude})")
        feature_service = FeatureExtractionService()
        
        # Try to detect city name
        city_name = None
        for component in geo_result.get('address_components', []):
            if 'locality' in component.get('types', []):
                city_name = component['long_name']
                break
        
        features = feature_service.extract_all_features(latitude, longitude, city_name)
        
        # Step 3: Get or select model
        if not model_run_id:
            # Use the best available model (highest R2 score)
            best_model = db_session.query(ModelRun).filter(
                ModelRun.status == 'completed'
            ).order_by(ModelRun.r2_score.desc()).first()
            
            if not best_model:
                return jsonify({'error': 'No trained models available'}), 404
            
            model_run_id = best_model.id
            logger.info(f"Using best model: {best_model.model_type} (R²={best_model.r2_score:.4f})")
        
        # Step 4: Load model
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run or model_run.status != 'completed':
            return jsonify({'error': 'Model not found or not completed'}), 400
        
        trainer = ModelTrainer.load_model(model_run_id, model_run.model_type)
        
        # Step 5: Prepare feature vector
        feature_vector = []
        for col in FEATURE_COLUMNS:
            feature_vector.append(float(features[col]))
        
        X = np.array([feature_vector])
        
        # Step 6: Make prediction
        prediction = trainer.predict(X)[0]
        
        # Step 7: Calculate confidence intervals (simple estimation)
        # In production, use proper prediction intervals
        rmse = model_run.rmse or 0
        lower_bound = max(0, prediction - (1.96 * rmse))
        upper_bound = prediction + (1.96 * rmse)
        
        # Step 8: Calculate investment score and ROI
        analyzer = InvestmentAnalyzer()
        investment_analysis = analyzer.calculate_investment_score(
            features, float(prediction)
        )
        
        # Step 9: Return comprehensive result
        return jsonify({
            'success': True,
            'predicted_price': float(prediction),
            'price_range': {
                'lower': float(lower_bound),
                'upper': float(upper_bound),
                'confidence': '95%'
            },
            'location_info': {
                'input': location,
                'formatted_address': geo_result['formatted_address'],
                'latitude': latitude,
                'longitude': longitude,
                'city': city_name
            },
            'features_extracted': features,
            'model_info': {
                'model_id': model_run.id,
                'model_type': model_run.model_type,
                'r2_score': model_run.r2_score,
                'rmse': model_run.rmse,
                'mae': model_run.mae
            },
            'investment_analysis': investment_analysis
        }), 200
        
    except Exception as e:
        logger.error(f"Location prediction error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@location_prediction_bp.route('/autocomplete', methods=['GET'])
def autocomplete_location():
    """
    Get location autocomplete suggestions
    
    Query params:
        input: Search text
        latitude: Optional center latitude
        longitude: Optional center longitude
    
    Returns:
        List of location suggestions
    """
    try:
        input_text = request.args.get('input', '')
        latitude = request.args.get('latitude', type=float)
        longitude = request.args.get('longitude', type=float)
        
        if not input_text:
            return jsonify({'suggestions': []}), 200
        
        geocoding_service = GeocodingService()
        
        location = (latitude, longitude) if latitude and longitude else None
        suggestions = geocoding_service.autocomplete(input_text, location)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions
        }), 200
        
    except Exception as e:
        logger.error(f"Autocomplete error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@location_prediction_bp.route('/batch', methods=['POST'])
def batch_predict_locations():
    """
    Predict prices for multiple locations
    
    Expected JSON:
    {
        "locations": ["Location 1", "Location 2", ...],
        "model_run_id": "uuid" (optional)
    }
    
    Returns:
        List of predictions for each location
    """
    try:
        data = request.get_json()
        
        locations = data.get('locations', [])
        model_run_id = data.get('model_run_id')
        
        if not locations:
            return jsonify({'error': 'No locations provided'}), 400
        
        # Get or select model
        if not model_run_id:
            best_model = db_session.query(ModelRun).filter(
                ModelRun.status == 'completed'
            ).order_by(ModelRun.r2_score.desc()).first()
            
            if not best_model:
                return jsonify({'error': 'No trained models available'}), 404
            
            model_run_id = best_model.id
        
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run or model_run.status != 'completed':
            return jsonify({'error': 'Model not found or not completed'}), 400
        
        trainer = ModelTrainer.load_model(model_run_id, model_run.model_type)
        
        # Process each location
        results = []
        geocoding_service = GeocodingService()
        feature_service = FeatureExtractionService()
        
        for location in locations:
            try:
                # Geocode
                geo_result = geocoding_service.geocode_location(location)
                
                if not geo_result:
                    results.append({
                        'location': location,
                        'success': False,
                        'error': 'Location not found'
                    })
                    continue
                
                # Extract features
                latitude = geo_result['latitude']
                longitude = geo_result['longitude']
                features = feature_service.extract_all_features(latitude, longitude)
                
                # Predict
                feature_vector = [float(features[col]) for col in FEATURE_COLUMNS]
                X = np.array([feature_vector])
                prediction = trainer.predict(X)[0]
                
                results.append({
                    'location': location,
                    'success': True,
                    'formatted_address': geo_result['formatted_address'],
                    'predicted_price': float(prediction),
                    'latitude': latitude,
                    'longitude': longitude
                })
                
            except Exception as loc_error:
                logger.error(f"Error processing location '{location}': {str(loc_error)}")
                results.append({
                    'location': location,
                    'success': False,
                    'error': str(loc_error)
                })
        
        return jsonify({
            'success': True,
            'model_id': model_run_id,
            'model_type': model_run.model_type,
            'results': results,
            'total': len(locations),
            'successful': sum(1 for r in results if r.get('success'))
        }), 200
        
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
