import shap
import numpy as np
from typing import Dict, List, Any
from models.ml_models import ModelTrainer

class ShapAnalyzer:
    """Handles SHAP analysis for model interpretability"""
    
    def __init__(self, model_trainer: ModelTrainer, X_background: np.ndarray):
        """
        Initialize SHAP analyzer
        
        Args:
            model_trainer: Trained model trainer instance
            X_background: Background dataset for SHAP (typically training data sample)
        """
        self.model_trainer = model_trainer
        self.model = model_trainer.model
        self.feature_names = model_trainer.feature_names or []
        
        # Select background dataset (sample if too large)
        if len(X_background) > 100:
            indices = np.random.choice(len(X_background), 100, replace=False)
            self.X_background = X_background[indices]
        else:
            self.X_background = X_background
        
        self.explainer = None
        
    def create_explainer(self):
        """Create SHAP explainer based on model type"""
        model_type = self.model_trainer.model_type
        
        if model_type in ['xgboost', 'lightgbm']:
            # Use TreeExplainer for tree-based models
            self.explainer = shap.TreeExplainer(self.model)
        elif model_type in ['gradient_boosting', 'random_forest']:
            # Use TreeExplainer for sklearn tree models
            self.explainer = shap.TreeExplainer(self.model)
        else:
            # Fallback to KernelExplainer
            self.explainer = shap.KernelExplainer(
                self.model.predict, 
                self.X_background
            )
    
    def calculate_shap_values(self, X: np.ndarray) -> np.ndarray:
        """
        Calculate SHAP values for given samples
        
        Args:
            X: Features to explain
            
        Returns:
            SHAP values array
        """
        if self.explainer is None:
            self.create_explainer()
        
        shap_values = self.explainer.shap_values(X)
        
        # Handle different SHAP value formats
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
        
        return shap_values
    
    def get_feature_importance(self, shap_values: np.ndarray) -> List[Dict[str, Any]]:
        """
        Calculate feature importance from SHAP values
        
        Args:
            shap_values: SHAP values array
            
        Returns:
            List of feature importance dictionaries
        """
        # Calculate mean absolute SHAP value for each feature
        mean_abs_shap = np.abs(shap_values).mean(axis=0)
        
        importance_list = []
        for idx, importance in enumerate(mean_abs_shap):
            feature_name = (
                self.feature_names[idx] 
                if idx < len(self.feature_names) 
                else f'feature_{idx}'
            )
            importance_list.append({
                'feature_name': feature_name,
                'importance': float(importance),
                'rank': 0  # Will be set after sorting
            })
        
        # Sort by importance
        importance_list.sort(key=lambda x: x['importance'], reverse=True)
        
        # Add ranks
        for rank, item in enumerate(importance_list, 1):
            item['rank'] = rank
        
        return importance_list
    
    def prepare_shap_records(
        self, 
        shap_values: np.ndarray, 
        grid_cell_ids: List[str],
        prediction_dates: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Prepare SHAP value records for database storage
        
        Args:
            shap_values: SHAP values array
            grid_cell_ids: List of grid cell IDs
            prediction_dates: List of prediction dates
            
        Returns:
            List of SHAP records
        """
        records = []
        
        for sample_idx in range(len(shap_values)):
            for feature_idx in range(len(shap_values[sample_idx])):
                feature_name = (
                    self.feature_names[feature_idx]
                    if feature_idx < len(self.feature_names)
                    else f'feature_{feature_idx}'
                )
                
                records.append({
                    'feature_name': feature_name,
                    'shap_value': float(shap_values[sample_idx][feature_idx]),
                    'grid_cell_id': grid_cell_ids[sample_idx] if sample_idx < len(grid_cell_ids) else None,
                    'prediction_date': prediction_dates[sample_idx] if sample_idx < len(prediction_dates) else None
                })
        
        return records
    
    def get_top_features(self, shap_values: np.ndarray, top_n: int = 10) -> List[str]:
        """
        Get top N most important features based on SHAP values
        
        Args:
            shap_values: SHAP values array
            top_n: Number of top features to return
            
        Returns:
            List of feature names
        """
        importance = self.get_feature_importance(shap_values)
        return [item['feature_name'] for item in importance[:top_n]]
