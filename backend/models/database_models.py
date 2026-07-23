from sqlalchemy import Column, String, Integer, Float, DateTime, Text, ForeignKey, JSON, Date
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class Dataset(Base):
    __tablename__ = 'datasets'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)
    record_count = Column(Integer)
    status = Column(String, default='pending')
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    features = relationship('Feature', back_populates='dataset', cascade='all, delete-orphan')
    land_prices = relationship('LandPrice', back_populates='dataset', cascade='all, delete-orphan')
    model_runs = relationship('ModelRun', back_populates='dataset', cascade='all, delete-orphan')

class Feature(Base):
    __tablename__ = 'features'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_id = Column(String, ForeignKey('datasets.id'))
    grid_cell_id = Column(String, nullable=False)
    assessment_date = Column(Date, nullable=False)
    building_density = Column(Float)
    population_density = Column(Float)
    avg_building_height = Column(Float)
    commercial_ratio = Column(Float)
    residential_ratio = Column(Float)
    distance_to_station = Column(Float)
    distance_to_highway = Column(Float)
    distance_to_city_center = Column(Float)
    school_count = Column(Integer)
    hospital_count = Column(Integer)
    park_area = Column(Float)
    road_density = Column(Float)
    public_transport_access = Column(Float)
    crime_rate = Column(Float)
    employment_rate = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    dataset = relationship('Dataset', back_populates='features')

class LandPrice(Base):
    __tablename__ = 'land_prices'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    dataset_id = Column(String, ForeignKey('datasets.id'))
    grid_cell_id = Column(String, nullable=False)
    assessment_date = Column(Date, nullable=False)
    price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    dataset = relationship('Dataset', back_populates='land_prices')

class GridCell(Base):
    __tablename__ = 'grid_cells'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    grid_code = Column(String, unique=True, nullable=False)
    latitude = Column(Float)
    longitude = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class ModelRun(Base):
    __tablename__ = 'model_runs'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    model_type = Column(String, nullable=False)
    dataset_id = Column(String, ForeignKey('datasets.id'))
    hyperparameters = Column(JSON)
    status = Column(String, default='pending')
    r2_score = Column(Float)
    rmse = Column(Float)
    mae = Column(Float)
    train_samples = Column(Integer)
    test_samples = Column(Integer)
    model_path = Column(String)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    dataset = relationship('Dataset', back_populates='model_runs')
    predictions = relationship('Prediction', back_populates='model_run', cascade='all, delete-orphan')
    shap_values = relationship('ShapValue', back_populates='model_run', cascade='all, delete-orphan')

class Prediction(Base):
    __tablename__ = 'predictions'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    model_run_id = Column(String, ForeignKey('model_runs.id'))
    grid_cell_id = Column(String)
    prediction_date = Column(Date)
    predicted_price = Column(Float, nullable=False)
    actual_price = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    model_run = relationship('ModelRun', back_populates='predictions')

class ShapValue(Base):
    __tablename__ = 'shap_values'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    model_run_id = Column(String, ForeignKey('model_runs.id'))
    feature_name = Column(String, nullable=False)
    shap_value = Column(Float, nullable=False)
    grid_cell_id = Column(String)
    prediction_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    model_run = relationship('ModelRun', back_populates='shap_values')
