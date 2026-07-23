from flask import Blueprint, request, jsonify
from database import db_session
from models.ml_models import ModelTrainer
from models.shap_analyzer import ShapAnalyzer
from models.database_models import ModelRun, ShapValue, Feature
import numpy as np
import traceback

shap_bp = Blueprint('shap', __name__)

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

@shap_bp.route('/analyze', methods=['POST'])
def analyze_shap():
    """
    Calculate SHAP values for specific samples
    
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
        X, grid_cell_ids, dates = prepare_feature_data(features_data)
        
        if len(X) == 0:
            return jsonify({'error': 'No valid features provided'}), 400
        
        # Create background dataset (use sample from features)
        background_size = min(100, len(X))
        X_background = X[:background_size]
        
        # Calculate SHAP values
        analyzer = ShapAnalyzer(trainer, X_background)
        shap_values = analyzer.calculate_shap_values(X)
        
        # Prepare results and save to database
        results = []
        db_records = []
        
        for idx, (grid_id, date) in enumerate(zip(grid_cell_ids, dates)):
            feature_shap_values = {}
            for feat_idx, feature_name in enumerate(FEATURE_COLUMNS):
                shap_val = float(shap_values[idx][feat_idx])
                feature_shap_values[feature_name] = shap_val
                
                # Create database record
                db_records.append(ShapValue(
                    model_run_id=model_run_id,
                    grid_cell_id=grid_id,
                    prediction_date=date,
                    feature_name=feature_name,
                    shap_value=shap_val
                ))
            
            results.append({
                'grid_cell_id': grid_id,
                'assessment_date': date,
                'shap_values': feature_shap_values
            })
        
        # Save SHAP values to database
        db_session.add_all(db_records)
        db_session.commit()
        
        # Get feature importance
        importance = analyzer.get_feature_importance(shap_values)
        
        return jsonify({
            'model_run_id': model_run_id,
            'shap_analysis': results,
            'feature_importance': importance
        }), 200
        
    except Exception as e:
        print(f"SHAP analysis error: {str(e)}")
        print(traceback.format_exc())
        db_session.rollback()
        return jsonify({'error': str(e)}), 500


@shap_bp.route('/generate/<model_run_id>', methods=['POST'])
def generate_shap_values(model_run_id):
    """Generate SHAP values for all features in the model's training dataset"""
    try:
        # Get model run
        model_run = db_session.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        
        if not model_run:
            return jsonify({'error': 'Model run not found'}), 404
        
        if model_run.status != 'completed':
            return jsonify({'error': 'Model training not completed'}), 400
        
        # Check if SHAP values already exist
        existing_count = db_session.query(ShapValue).filter(
            ShapValue.model_run_id == model_run_id
        ).count()
        
        if existing_count > 0:
            return jsonify({
                'message': 'SHAP values already exist',
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
        
        # Prepare features
        X, grid_cell_ids, dates = prepare_feature_data(features_data)
        
        if len(X) == 0:
            return jsonify({'error': 'No valid features found'}), 400
        
        # Use smaller background sample for performance
        background_size = min(50, len(X))
        X_background = X[:background_size]
        
        # Calculate SHAP values
        analyzer = ShapAnalyzer(trainer, X_background)
        shap_values = analyzer.calculate_shap_values(X)
        
        # Save to database in batches
        db_records = []
        for idx, (grid_id, date) in enumerate(zip(grid_cell_ids, dates)):
            for feat_idx, feature_name in enumerate(FEATURE_COLUMNS):
                shap_val = float(shap_values[idx][feat_idx])
                db_records.append(ShapValue(
                    model_run_id=model_run_id,
                    grid_cell_id=grid_id,
                    prediction_date=date,
                    feature_name=feature_name,
                    shap_value=shap_val
                ))
        
        # Save in batches
        batch_size = 1000
        for i in range(0, len(db_records), batch_size):
            batch = db_records[i:i + batch_size]
            db_session.add_all(batch)
        db_session.commit()
        
        return jsonify({
            'message': 'SHAP values generated successfully',
            'model_run_id': model_run_id,
            'count': len(db_records)
        }), 200
        
    except Exception as e:
        print(f"Error generating SHAP values: {str(e)}")
        print(traceback.format_exc())
        db_session.rollback()
        return jsonify({'error': str(e)}), 500


@shap_bp.route('/importance/<model_run_id>', methods=['GET'])
def get_feature_importance(model_run_id):
    """Get aggregated feature importance from stored SHAP values"""
    try:
        # Fetch SHAP values from database
        shap_values = db_session.query(ShapValue).filter(
            ShapValue.model_run_id == model_run_id
        ).all()
        
        if not shap_values:
            # Return empty list instead of 404 so frontend can show generate button
            return jsonify({
                'model_run_id': model_run_id,
                'feature_importance': []
            }), 200
        
        # Aggregate by feature
        feature_map = {}
        for record in shap_values:
            feature_name = record.feature_name
            shap_value = abs(record.shap_value)
            
            if feature_name not in feature_map:
                feature_map[feature_name] = {
                    'sum': 0,
                    'count': 0
                }
            
            feature_map[feature_name]['sum'] += shap_value
            feature_map[feature_name]['count'] += 1
        
        # Calculate average importance
        importance_list = []
        for feature_name, stats in feature_map.items():
            importance_list.append({
                'feature_name': feature_name,
                'avg_importance': stats['sum'] / stats['count'],
                'sample_count': stats['count']
            })
        
        # Sort by importance
        importance_list.sort(key=lambda x: x['avg_importance'], reverse=True)
        
        # Add ranks
        for rank, item in enumerate(importance_list, 1):
            item['rank'] = rank
        
        return jsonify({
            'model_run_id': model_run_id,
            'feature_importance': importance_list
        }), 200
        
    except Exception as e:
        print(f"Feature importance error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500


def prepare_feature_data(features_data):
    """Prepare feature data from records"""
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
            dates.append(feature_record.get('assessment_date', ''))
    
    return (
        np.array(X_list),
        grid_cell_ids,
        dates
    )