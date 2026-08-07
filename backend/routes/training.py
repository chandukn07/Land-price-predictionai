from flask import Blueprint, request, jsonify
from database import SessionLocal
from models.database_models import Dataset, Feature, LandPrice, ModelRun, Prediction, ShapValue
from models.ml_models import ModelTrainer
from models.shap_analyzer import ShapAnalyzer
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from datetime import datetime
import traceback

training_bp = Blueprint('training', __name__)

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

@training_bp.route('/start', methods=['POST'])
def start_training():
    """
    Start model training job
    
    Expected JSON:
    {
        "model_run_id": "uuid",
        "dataset_id": "uuid",
        "model_type": "xgboost",
        "hyperparameters": {...},
        "test_size": 0.2
    }
    """
    try:
        data = request.get_json()
        
        model_run_id = data.get('model_run_id')
        dataset_id = data.get('dataset_id')
        model_type = data.get('model_type')
        hyperparameters = data.get('hyperparameters', {})
        test_size = data.get('test_size', 0.2)
        
        if not all([model_run_id, dataset_id, model_type]):
            return jsonify({'error': 'Missing required parameters'}), 400
        
        # Create database session
        db = SessionLocal()
        
        try:
            # Update status to training
            model_run = db.query(ModelRun).filter(ModelRun.id == model_run_id).first()
            if model_run:
                model_run.status = 'training'
                model_run.started_at = datetime.utcnow()
                db.commit()
            
            # Fetch dataset
            dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
            if not dataset:
                raise ValueError(f"Dataset {dataset_id} not found")
            
            # Fetch features
            features_data = db.query(Feature).filter(Feature.dataset_id == dataset_id).all()
            
            # Fetch land prices
            prices_data = db.query(LandPrice).filter(LandPrice.dataset_id == dataset_id).all()
            
            if not features_data or not prices_data:
                raise ValueError("No data found for dataset")
            
            # Prepare data
            X, y, grid_cell_ids, dates = prepare_training_data(features_data, prices_data)
            
            if len(X) == 0:
                raise ValueError("No valid training data after preprocessing")
            
            # Split data
            X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
                X, y, np.arange(len(X)), test_size=test_size, random_state=42
            )
            
            grid_train = [grid_cell_ids[i] for i in idx_train]
            grid_test = [grid_cell_ids[i] for i in idx_test]
            dates_train = [dates[i] for i in idx_train]
            dates_test = [dates[i] for i in idx_test]
            
            # Train model
            trainer = ModelTrainer(model_type, hyperparameters)
            metrics = trainer.train(X_train, y_train, X_test, y_test, feature_names=FEATURE_COLUMNS)
            
            # Save model
            model_path = trainer.save_model(model_run_id)
            
            # Calculate SHAP values
            shap_analyzer = ShapAnalyzer(trainer, X_train)
            shap_values_test = shap_analyzer.calculate_shap_values(X_test)
            
            # Prepare SHAP records for database
            shap_records = shap_analyzer.prepare_shap_records(
                shap_values_test, 
                grid_test, 
                dates_test
            )
            
            # Save SHAP values to database
            batch_size = 1000
            for i in range(0, len(shap_records), batch_size):
                batch = shap_records[i:i + batch_size]
                for record in batch:
                    shap_val = ShapValue(
                        model_run_id=model_run_id,
                        feature_name=record['feature_name'],
                        shap_value=record['shap_value'],
                        grid_cell_id=record.get('grid_cell_id'),
                        prediction_date=record.get('prediction_date')
                    )
                    db.add(shap_val)
                db.commit()
            
            # Save predictions
            test_predictions = trainer.predict(X_test)
            
            for pred, actual, grid_id, date in zip(test_predictions, y_test, grid_test, dates_test):
                prediction = Prediction(
                    model_run_id=model_run_id,
                    grid_cell_id=grid_id,
                    prediction_date=date,
                    predicted_price=float(pred),
                    actual_price=float(actual)
                )
                db.add(prediction)
            db.commit()
            
            # Update model run with results
            model_run = db.query(ModelRun).filter(ModelRun.id == model_run_id).first()
            if model_run:
                model_run.status = 'completed'
                model_run.completed_at = datetime.utcnow()
                model_run.r2_score = metrics['test_r2']
                model_run.rmse = metrics['test_rmse']
                model_run.mae = metrics['test_mae']
                model_run.train_samples = len(X_train)
                model_run.test_samples = len(X_test)
                model_run.model_path = model_path
                db.commit()
        
        except Exception as inner_e:
            db.rollback()
            raise inner_e
        finally:
            db.close()
        
        return jsonify({
            'status': 'completed',
            'model_run_id': model_run_id,
            'metrics': metrics,
            'samples': {
                'train': len(X_train),
                'test': len(X_test)
            }
        }), 200
        
    except Exception as e:
        # Update status to failed
        if model_run_id:
            db = SessionLocal()
            try:
                model_run = db.query(ModelRun).filter(ModelRun.id == model_run_id).first()
                if model_run:
                    model_run.status = 'failed'
                    model_run.error_message = str(e)
                    db.commit()
            finally:
                db.close()
        
        print(f"Training error: {str(e)}")
        print(traceback.format_exc())
        
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500


def prepare_training_data(features_data, prices_data):
    """Prepare training data from database records"""
    # Create price lookup
    price_map = {}
    for price_record in prices_data:
        key = f"{price_record.grid_cell_id}_{price_record.assessment_date}"
        price_map[key] = price_record.price
    
    X_list = []
    y_list = []
    grid_cell_ids = []
    dates = []
    
    for feature_record in features_data:
        key = f"{feature_record.grid_cell_id}_{feature_record.assessment_date}"
        
        if key not in price_map:
            continue
        
        # Extract features
        feature_vector = []
        valid = True
        
        for col in FEATURE_COLUMNS:
            value = getattr(feature_record, col, None)
            if value is None:
                valid = False
                break
            feature_vector.append(float(value))
        
        if valid and len(feature_vector) == len(FEATURE_COLUMNS):
            X_list.append(feature_vector)
            y_list.append(price_map[key])
            grid_cell_ids.append(feature_record.grid_cell_id)
            dates.append(feature_record.assessment_date)
    
    return (
        np.array(X_list),
        np.array(y_list),
        grid_cell_ids,
        dates
    )


@training_bp.route('/status/<model_run_id>', methods=['GET'])
def get_training_status(model_run_id):
    """Get status of a training job"""
    db = SessionLocal()
    try:
        model_run = db.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        if not model_run:
            return jsonify({'error': 'Model run not found'}), 404
        
        return jsonify({
            'id': model_run.id,
            'model_type': model_run.model_type,
            'status': model_run.status,
            'r2_score': model_run.r2_score,
            'rmse': model_run.rmse,
            'mae': model_run.mae,
            'created_at': model_run.created_at.isoformat() if model_run.created_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()
