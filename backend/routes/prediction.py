from flask import Blueprint, request, jsonify
from database import db_session
from models.ml_models import ModelTrainer
from models.database_models import ModelRun, Prediction, Feature
import numpy as np
from datetime import datetime
import traceback

prediction_bp = Blueprint('prediction', __name__)

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

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    """
    Make predictions using a trained model
    
    Expected JSON:
    {
        "model_run_id": "uuid",
        "features": [
            {
                "grid_cell_id": "A1",
                "assessment_date": "2024-01-01",
                "building_density": 0.5,
                ...
            }
        ]
    }
    """
    try:
        data = request.get_json()
        
        model_run_id = data.get('model_run_id')
        features_data = data.get('features', [])
        
        if not model_run_id or not features_data:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Get model info
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run or model_run.status != 'completed':
            return jsonify({'error': 'Model training not completed'}), 400
        
        # Load trained model
        trainer = ModelTrainer.load_model(model_run_id, model_run.model_type)
        
        # Prepare features
        X, grid_cell_ids, dates = prepare_prediction_data(features_data)
        
        if len(X) == 0:
            return jsonify({'error': 'No valid features provided'}), 400
        
        # Make predictions
        predictions = trainer.predict(X)
        
        # Prepare results
        results = []
        for pred, grid_id, date in zip(predictions, grid_cell_ids, dates):
            results.append({
                'grid_cell_id': grid_id,
                'assessment_date': date,
                'predicted_price': float(pred)
            })
        
        return jsonify({
            'model_run_id': model_run_id,
            'predictions': results
        }), 200
        
    except Exception as e:
        print(f"Prediction error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@prediction_bp.route('/batch', methods=['POST'])
def batch_predict():
    """
    Make batch predictions and save to database
    
    Expected JSON:
    {
        "model_run_id": "uuid",
        "dataset_id": "uuid"
    }
    """
    try:
        data = request.get_json()
        
        model_run_id = data.get('model_run_id')
        dataset_id = data.get('dataset_id')
        
        if not model_run_id or not dataset_id:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Get model info
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run or model_run.status != 'completed':
            return jsonify({'error': 'Model training not completed'}), 400
        
        # Load trained model
        trainer = ModelTrainer.load_model(model_run_id, model_run.model_type)
        
        # Fetch features
        features = db_session.query(Feature).filter(Feature.dataset_id == dataset_id).all()
        features_data = [{
            col: getattr(feature, col)
            for col in FEATURE_COLUMNS + ['grid_cell_id', 'assessment_date']
        } for feature in features]
        
        if not features_data:
            return jsonify({'error': 'No features found for dataset'}), 404
        
        # Prepare features
        X, grid_cell_ids, dates = prepare_prediction_data(features_data)
        
        if len(X) == 0:
            return jsonify({'error': 'No valid features in dataset'}), 400
        
        # Make predictions
        predictions = trainer.predict(X)
        
        # Prepare records for database
        prediction_records = []
        for pred, grid_id, date in zip(predictions, grid_cell_ids, dates):
            prediction = Prediction(
                model_run_id=model_run_id,
                grid_cell_id=grid_id,
                prediction_date=date,
                predicted_price=float(pred),
                actual_price=None  # Will be filled if available
            )
            prediction_records.append(prediction)
        
        # Save predictions in batches
        batch_size = 1000
        for i in range(0, len(prediction_records), batch_size):
            batch = prediction_records[i:i + batch_size]
            db_session.add_all(batch)
        db_session.commit()
        
        return jsonify({
            'model_run_id': model_run_id,
            'predictions_count': len(prediction_records)
        }), 200
        
    except Exception as e:
        print(f"Batch prediction error: {str(e)}")
        print(traceback.format_exc())
        db_session.rollback()
        return jsonify({'error': str(e)}), 500


@prediction_bp.route('/model_run/<model_run_id>', methods=['GET'])
def get_predictions_for_model(model_run_id):
    """
    Get all predictions for a specific model run
    """
    try:
        # Check if model run exists
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run:
            return jsonify({'error': 'Model run not found'}), 404
        
        # Get predictions
        predictions = db_session.query(Prediction).filter(
            Prediction.model_run_id == model_run_id
        ).all()
        
        # Format results
        results = []
        for pred in predictions:
            results.append({
                'id': pred.id,
                'grid_cell_id': pred.grid_cell_id,
                'prediction_date': pred.prediction_date.isoformat() if pred.prediction_date else None,
                'predicted_price': pred.predicted_price,
                'actual_price': pred.actual_price,
                'created_at': pred.created_at.isoformat() if pred.created_at else None
            })
        
        return jsonify({
            'model_run_id': model_run_id,
            'predictions': results,
            'count': len(results)
        }), 200
        
    except Exception as e:
        print(f"Error fetching predictions: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


@prediction_bp.route('/generate/<model_run_id>', methods=['POST'])
def generate_predictions(model_run_id):
    """
    Generate predictions for all features in the model's training dataset
    """
    try:
        # Get model run
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run:
            return jsonify({'error': 'Model run not found'}), 404
        
        if model_run.status != 'completed':
            return jsonify({'error': 'Model training not completed'}), 400
        
        # Check if predictions already exist
        existing_count = db_session.query(Prediction).filter(
            Prediction.model_run_id == model_run_id
        ).count()
        
        if existing_count > 0:
            return jsonify({
                'message': 'Predictions already exist',
                'count': existing_count
            }), 200
        
        # Load model
        trainer = ModelTrainer.load_model(model_run_id, model_run.model_type)
        
        # Get features from the dataset
        features = db_session.query(Feature).filter(
            Feature.dataset_id == model_run.dataset_id
        ).all()
        
        if not features:
            return jsonify({'error': 'No features found for this model'}), 404
        
        # Prepare feature data
        features_data = []
        for feature in features:
            feature_dict = {
                'grid_cell_id': feature.grid_cell_id,
                'assessment_date': feature.assessment_date
            }
            for col in FEATURE_COLUMNS:
                feature_dict[col] = getattr(feature, col)
            features_data.append(feature_dict)
        
        # Prepare and predict
        X, grid_cell_ids, dates = prepare_prediction_data(features_data)
        
        if len(X) == 0:
            return jsonify({'error': 'No valid features found'}), 400
        
        # Make predictions
        predictions = trainer.predict(X)
        
        # Save to database
        prediction_records = []
        for pred, grid_id, date in zip(predictions, grid_cell_ids, dates):
            prediction = Prediction(
                model_run_id=model_run_id,
                grid_cell_id=grid_id,
                prediction_date=date,
                predicted_price=float(pred),
                actual_price=None
            )
            prediction_records.append(prediction)
        
        # Save in batches
        batch_size = 1000
        for i in range(0, len(prediction_records), batch_size):
            batch = prediction_records[i:i + batch_size]
            db_session.add_all(batch)
        db_session.commit()
        
        return jsonify({
            'message': 'Predictions generated successfully',
            'model_run_id': model_run_id,
            'count': len(prediction_records)
        }), 200
        
    except Exception as e:
        print(f"Error generating predictions: {str(e)}")
        print(traceback.format_exc())
        db_session.rollback()
        return jsonify({'error': str(e)}), 500


def prepare_prediction_data(features_data):
    """Prepare prediction data from feature records"""
    X_list = []
    grid_cell_ids = []
    dates = []
    
    for feature_record in features_data:
        # Extract features
        feature_vector = []
        valid = True
        
        for col in FEATURE_COLUMNS:
            value = feature_record.get(col)
            if value is None:
                valid = False
                break
            feature_vector.append(float(value))
        
        if valid and len(feature_vector) == len(FEATURE_COLUMNS):
            X_list.append(feature_vector)
            grid_cell_ids.append(feature_record.get('grid_cell_id', 'unknown'))
            dates.append(feature_record.get('assessment_date', datetime.utcnow().isoformat()))
    
    return (
        np.array(X_list),
        grid_cell_ids,
        dates
    )