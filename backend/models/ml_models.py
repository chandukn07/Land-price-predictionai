from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from xgboost import XGBRegressor
from lightgbm import LGBMRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
import numpy as np
import joblib
import os
from typing import Dict, Any, Tuple
from config import Config

class ModelTrainer:
    """Handles training of various ensemble ML models"""
    
    MODELS = {
        'gradient_boosting': GradientBoostingRegressor,
        'xgboost': XGBRegressor,
        'lightgbm': LGBMRegressor,
        'random_forest': RandomForestRegressor
    }
    
    def __init__(self, model_type: str, hyperparameters: Dict[str, Any]):
        """
        Initialize model trainer
        
        Args:
            model_type: Type of model to train
            hyperparameters: Model hyperparameters
        """
        if model_type not in self.MODELS:
            raise ValueError(f"Invalid model type. Choose from: {list(self.MODELS.keys())}")
        
        self.model_type = model_type
        self.hyperparameters = self._prepare_hyperparameters(model_type, hyperparameters)
        self.model = None
        self.feature_names = None
        
    def _prepare_hyperparameters(self, model_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare hyperparameters for specific model types"""
        base_params = {
            'random_state': Config.RANDOM_STATE
        }
        
        if model_type == 'gradient_boosting':
            return {
                **base_params,
                'n_estimators': params.get('n_estimators', 100),
                'learning_rate': params.get('learning_rate', 0.1),
                'max_depth': params.get('max_depth', 6),
                'min_samples_split': params.get('min_samples_split', 2),
                'min_samples_leaf': params.get('min_samples_leaf', 1)
            }
        elif model_type == 'xgboost':
            return {
                **base_params,
                'n_estimators': params.get('n_estimators', 100),
                'learning_rate': params.get('learning_rate', 0.1),
                'max_depth': params.get('max_depth', 6),
                'subsample': params.get('subsample', 0.8),
                'colsample_bytree': params.get('colsample_bytree', 0.8)
            }
        elif model_type == 'lightgbm':
            return {
                **base_params,
                'n_estimators': params.get('n_estimators', 100),
                'learning_rate': params.get('learning_rate', 0.1),
                'max_depth': params.get('max_depth', 6),
                'num_leaves': params.get('num_leaves', 31),
                'verbose': -1
            }
        elif model_type == 'random_forest':
            return {
                **base_params,
                'n_estimators': params.get('n_estimators', 100),
                'max_depth': params.get('max_depth', 6),
                'min_samples_split': params.get('min_samples_split', 2),
                'min_samples_leaf': params.get('min_samples_leaf', 1),
                'n_jobs': Config.MAX_WORKERS
            }
        
        return params
    
    def train(
        self, 
        X_train: np.ndarray, 
        y_train: np.ndarray, 
        X_test: np.ndarray, 
        y_test: np.ndarray,
        feature_names: list = None
    ) -> Dict[str, Any]:
        """
        Train the model and evaluate performance
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_test: Test features
            y_test: Test targets
            feature_names: List of feature names
            
        Returns:
            Dictionary with model metrics
        """
        # Initialize model
        model_class = self.MODELS[self.model_type]
        self.model = model_class(**self.hyperparameters)
        self.feature_names = feature_names
        
        # Train model
        self.model.fit(X_train, y_train)
        
        # Make predictions
        train_predictions = self.model.predict(X_train)
        test_predictions = self.model.predict(X_test)
        
        # Calculate metrics
        metrics = {
            'train_r2': r2_score(y_train, train_predictions),
            'train_rmse': np.sqrt(mean_squared_error(y_train, train_predictions)),
            'train_mae': mean_absolute_error(y_train, train_predictions),
            'test_r2': r2_score(y_test, test_predictions),
            'test_rmse': np.sqrt(mean_squared_error(y_test, test_predictions)),
            'test_mae': mean_absolute_error(y_test, test_predictions)
        }
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions using trained model"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        return self.model.predict(X)
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        if hasattr(self.model, 'feature_importances_'):
            importances = self.model.feature_importances_
            if self.feature_names:
                return dict(zip(self.feature_names, importances))
            else:
                return {f'feature_{i}': imp for i, imp in enumerate(importances)}
        else:
            return {}
    
    def save_model(self, model_run_id: str) -> str:
        """Save trained model to disk"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        filepath = os.path.join(
            Config.MODEL_STORAGE_PATH, 
            f"{model_run_id}_{self.model_type}.joblib"
        )
        
        model_data = {
            'model': self.model,
            'model_type': self.model_type,
            'hyperparameters': self.hyperparameters,
            'feature_names': self.feature_names
        }
        
        joblib.dump(model_data, filepath)
        return filepath
    
    @staticmethod
    def load_model(model_run_id: str, model_type: str) -> 'ModelTrainer':
        """Load trained model from disk"""
        filepath = os.path.join(
            Config.MODEL_STORAGE_PATH, 
            f"{model_run_id}_{model_type}.joblib"
        )
        
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
        
        model_data = joblib.load(filepath)
        
        trainer = ModelTrainer(model_type, model_data['hyperparameters'])
        trainer.model = model_data['model']
        trainer.feature_names = model_data['feature_names']
        
        return trainer
