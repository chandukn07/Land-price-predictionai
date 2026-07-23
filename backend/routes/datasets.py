from flask import Blueprint, request, jsonify
from database import SessionLocal
from models.database_models import Dataset, Feature, LandPrice, GridCell
from datetime import datetime
import pandas as pd
import io
import traceback

datasets_bp = Blueprint('datasets', __name__)

@datasets_bp.route('/', methods=['GET'])
def get_datasets():
    """Get all datasets"""
    db = SessionLocal()
    try:
        datasets = db.query(Dataset).order_by(Dataset.created_at.desc()).all()
        
        result = []
        for dataset in datasets:
            # Count records
            feature_count = db.query(Feature).filter(Feature.dataset_id == dataset.id).count()
            price_count = db.query(LandPrice).filter(LandPrice.dataset_id == dataset.id).count()
            
            # Get date range
            first_price = db.query(LandPrice).filter(
                LandPrice.dataset_id == dataset.id
            ).order_by(LandPrice.assessment_date.asc()).first()
            
            last_price = db.query(LandPrice).filter(
                LandPrice.dataset_id == dataset.id
            ).order_by(LandPrice.assessment_date.desc()).first()
            
            result.append({
                'id': dataset.id,
                'name': dataset.name,
                'description': dataset.description,
                'status': dataset.status,
                'record_count': price_count,
                'feature_count': feature_count,
                'created_at': dataset.created_at.isoformat() if dataset.created_at else None,
                'upload_date': dataset.created_at.isoformat() if dataset.created_at else None,
                'date_range_start': first_price.assessment_date.isoformat() if first_price else None,
                'date_range_end': last_price.assessment_date.isoformat() if last_price else None
            })
        
        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching datasets: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@datasets_bp.route('/', methods=['POST'])
def upload_dataset():
    """
    Upload dataset from CSV or JSON
    
    Expected JSON format:
    {
        "name": "Dataset Name",
        "description": "Optional description",
        "data": {
            "features": [...],
            "prices": [...]
        }
    }
    
    Or CSV file upload
    """
    db = SessionLocal()
    try:
        # Check if it's a file upload or JSON
        if 'file' in request.files:
            return handle_csv_upload(request, db)
        else:
            return handle_json_upload(request, db)
    except Exception as e:
        db.rollback()
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({'error': str(e), 'traceback': traceback.format_exc()}), 500
    finally:
        db.close()


def handle_json_upload(request, db):
    """Handle JSON data upload"""
    data = request.get_json()
    
    if not data or 'name' not in data:
        return jsonify({'error': 'Dataset name is required'}), 400
    
    # Create dataset record
    dataset = Dataset(
        name=data['name'],
        description=data.get('description', ''),
        status='processing'
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    dataset_data = data.get('data', {})
    features_data = dataset_data.get('features', [])
    prices_data = dataset_data.get('prices', [])
    
    if not features_data or not prices_data:
        dataset.status = 'error'
        db.commit()
        return jsonify({'error': 'No features or prices data provided'}), 400
    
    # Process grid cells first
    grid_codes = set()
    for feature in features_data:
        if 'grid_cell_id' in feature:
            grid_codes.add(feature['grid_cell_id'])
    for price in prices_data:
        if 'grid_cell_id' in price:
            grid_codes.add(price['grid_cell_id'])
    
    # Create grid cells if they don't exist
    for grid_code in grid_codes:
        existing_grid = db.query(GridCell).filter(GridCell.grid_code == grid_code).first()
        if not existing_grid:
            grid_cell = GridCell(
                grid_code=grid_code,
                latitude=None,
                longitude=None
            )
            db.add(grid_cell)
    db.commit()
    
    # Insert features
    for feature_data in features_data:
        feature = Feature(
            dataset_id=dataset.id,
            grid_cell_id=feature_data.get('grid_cell_id'),
            assessment_date=pd.to_datetime(feature_data.get('assessment_date')).date(),
            building_density=feature_data.get('building_density'),
            population_density=feature_data.get('population_density'),
            avg_building_height=feature_data.get('avg_building_height'),
            commercial_ratio=feature_data.get('commercial_ratio'),
            residential_ratio=feature_data.get('residential_ratio'),
            distance_to_station=feature_data.get('distance_to_station'),
            distance_to_highway=feature_data.get('distance_to_highway'),
            distance_to_city_center=feature_data.get('distance_to_city_center'),
            school_count=feature_data.get('school_count'),
            hospital_count=feature_data.get('hospital_count'),
            park_area=feature_data.get('park_area'),
            road_density=feature_data.get('road_density'),
            public_transport_access=feature_data.get('public_transport_access'),
            crime_rate=feature_data.get('crime_rate'),
            employment_rate=feature_data.get('employment_rate')
        )
        db.add(feature)
    
    # Insert prices
    for price_data in prices_data:
        price = LandPrice(
            dataset_id=dataset.id,
            grid_cell_id=price_data.get('grid_cell_id'),
            assessment_date=pd.to_datetime(price_data.get('assessment_date')).date(),
            price=price_data.get('price')
        )
        db.add(price)
    
    # Update dataset status
    dataset.status = 'ready'
    dataset.record_count = len(prices_data)
    db.commit()
    
    return jsonify({
        'message': 'Dataset uploaded successfully',
        'dataset_id': dataset.id,
        'features_count': len(features_data),
        'prices_count': len(prices_data)
    }), 201


def handle_csv_upload(request, db):
    """Handle CSV file upload"""
    file = request.files['file']
    dataset_name = request.form.get('name', file.filename)
    dataset_description = request.form.get('description', '')
    
    if not file:
        return jsonify({'error': 'No file provided'}), 400
    
    # Read CSV
    content = file.read().decode('utf-8')
    df = pd.read_csv(io.StringIO(content))
    
    # Create dataset
    dataset = Dataset(
        name=dataset_name,
        description=dataset_description,
        status='processing'
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    
    # Process the CSV data
    # This is a placeholder - you'll need to adapt based on your CSV format
    try:
        process_csv_data(df, dataset.id, db)
        dataset.status = 'ready'
        dataset.record_count = len(df)
        db.commit()
        
        return jsonify({
            'message': 'CSV uploaded successfully',
            'dataset_id': dataset.id,
            'record_count': len(df)
        }), 201
    except Exception as e:
        dataset.status = 'error'
        db.commit()
        raise e


def process_csv_data(df, dataset_id, db):
    """Process CSV data and insert into database"""
    # This function should be customized based on your CSV format
    # For now, it's a placeholder
    pass


@datasets_bp.route('/<dataset_id>', methods=['GET'])
def get_dataset(dataset_id):
    """Get a specific dataset"""
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
        
        return jsonify({
            'id': dataset.id,
            'name': dataset.name,
            'description': dataset.description,
            'status': dataset.status,
            'record_count': dataset.record_count,
            'created_at': dataset.created_at.isoformat() if dataset.created_at else None
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()


@datasets_bp.route('/<dataset_id>', methods=['DELETE'])
def delete_dataset(dataset_id):
    """Delete a dataset"""
    db = SessionLocal()
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            return jsonify({'error': 'Dataset not found'}), 404
        
        db.delete(dataset)
        db.commit()
        
        return jsonify({'message': 'Dataset deleted successfully'}), 200
    except Exception as e:
        db.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        db.close()
