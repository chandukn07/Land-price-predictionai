from flask import Blueprint, request, jsonify
from database import SessionLocal
from models.database_models import ModelRun, Dataset
from datetime import datetime
import traceback
import math

model_runs_bp = Blueprint('model_runs', __name__)

def sanitize_nan(obj):
    """Convert NaN values to None for JSON serialization"""
    if isinstance(obj, dict):
        return {k: sanitize_nan(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_nan(item) for item in obj]
    elif isinstance(obj, float) and (math.isnan(obj) or math.isinf(obj)):
        return None
    return obj

@model_runs_bp.route('/', methods=['GET'])
def get_model_runs():
    """Get all model runs"""
    db = SessionLocal()
    try:
        # Get query parameters
        limit = request.args.get('limit', type=int)
        status = request.args.get('status', type=str)
        dataset_id = request.args.get('dataset_id', type=str)
        
        query = db.query(ModelRun)
        
        # Apply filters
        if status:
            query = query.filter(ModelRun.status == status)
        if dataset_id:
            query = query.filter(ModelRun.dataset_id == dataset_id)
        
        # Order and limit
        query = query.order_by(ModelRun.created_at.desc())
        if limit:
            query = query.limit(limit)
        
        model_runs = query.all()
        
        result = []
        for run in model_runs:
            result.append(sanitize_nan({
                'id': run.id,
                'model_type': run.model_type,
                'dataset_id': run.dataset_id,
                'hyperparameters': run.hyperparameters,
                'status': run.status,
                'r2_score': run.r2_score,
                'rmse': run.rmse,
                'mae': run.mae,
                'train_samples': run.train_samples,
                'test_samples': run.test_samples,
                'model_path': run.model_path,
                'error_message': run.error_message,
                'started_at': run.started_at.isoformat() if run.started_at else None,
                'completed_at': run.completed_at.isoformat() if run.completed_at else None,
                'created_at': run.created_at.isoformat() if run.created_at else None
            }))
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching model runs: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@model_runs_bp.route('/', methods=['POST'])
def create_model_run():
    """Create a new model run"""
    db = SessionLocal()
    try:
        data = request.get_json()
        
        model_type = data.get('model_type')
        dataset_id = data.get('dataset_id')
        hyperparameters = data.get('hyperparameters', {})
        status = data.get('status', 'pending')
        
        if not model_type or not dataset_id:
            return jsonify({'error': 'model_type and dataset_id are required'}), 400
        
        # Verify dataset exists
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
        
        # Create model run
        model_run = ModelRun(
            model_type=model_type,
            dataset_id=dataset_id,
            hyperparameters=hyperparameters,
            status=status
        )
        db.add(model_run)
        db.commit()
        db.refresh(model_run)
        
        return jsonify({
            'id': model_run.id,
            'model_type': model_run.model_type,
            'dataset_id': model_run.dataset_id,
            'hyperparameters': model_run.hyperparameters,
            'status': model_run.status,
            'created_at': model_run.created_at.isoformat() if model_run.created_at else None
        }), 201
    except Exception as e:
        db.rollback()
        print(f"Error creating model run: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@model_runs_bp.route('/<model_run_id>', methods=['GET'])
def get_model_run(model_run_id):
    """Get a specific model run"""
    db = SessionLocal()
    try:
        model_run = db.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        if not model_run:
            return jsonify({'error': 'Model run not found'}), 404
        
        return jsonify(sanitize_nan({
            'id': model_run.id,
            'model_type': model_run.model_type,
            'dataset_id': model_run.dataset_id,
            'hyperparameters': model_run.hyperparameters,
            'status': model_run.status,
            'r2_score': model_run.r2_score,
            'rmse': model_run.rmse,
            'mae': model_run.mae,
            'train_samples': model_run.train_samples,
            'test_samples': model_run.test_samples,
            'model_path': model_run.model_path,
            'error_message': model_run.error_message,
            'started_at': model_run.started_at.isoformat() if model_run.started_at else None,
            'completed_at': model_run.completed_at.isoformat() if model_run.completed_at else None,
            'created_at': model_run.created_at.isoformat() if model_run.created_at else None
        })), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@model_runs_bp.route('/<model_run_id>', methods=['DELETE'])
def delete_model_run(model_run_id):
    """Delete a model run"""
    db = SessionLocal()
    try:
        model_run = db.query(ModelRun).filter(ModelRun.id == model_run_id).first()
        if not model_run:
            return jsonify({'error': 'Model run not found'}), 404
        
        db.delete(model_run)
        db.commit()
        
        return jsonify({'message': 'Model run deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()
