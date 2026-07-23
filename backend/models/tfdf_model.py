"""
TensorFlow Decision Forests Model Wrapper
Adds TF-DF support alongside existing sklearn/XGBoost/LightGBM models
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from config import Config
import os
import joblib

try:
    import tensorflow as tf
    import tensorflow_decision_forests as tfdf
    TFDF_AVAILABLE = True
except ImportError:
    TFDF_AVAILABLE = False
    print("⚠️  TensorFlow Decision Forests not installed. Install with: pip install tensorflow tensorflow-decision-forests")


class TFDFModelTrainer:
    """TensorFlow Decision Forests model trainer"""
    
    MODELS = {
        'tfdf_random_forest': 'RandomForestModel',
        'tfdf_gradient_boosted_trees': 'GradientBoostedTreesModel',
        'tfdf_cart': 'CartModel'
    }
    
    def __init__(self, model_type: str, hyperparameters: Dict[str, Any]):
        """
        Initialize TF-DF model trainer
        
        Args:
            model_type: Type of TF-DF model
            hyperparameters: Model hyperparameters
        """
        if not TFDF_AVAILABLE:
            raise ImportError("TensorFlow Decision Forests not available. Install with: pip install tensorflow tensorflow-decision-forests")
        
        if model_type not in self.MODELS:
            raise ValueError(f"Invalid TF-DF model type. Choose from: {list(self.MODELS.keys())}")
        
        self.model_type = model_type
        self.hyperparameters = self._prepare_hyperparameters(model_type, hyperparameters)
        self.model = None
        self.feature_names = None
        
    def _prepare_hyperparameters(self, model_type: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """Prepare hyperparameters for TF-DF models"""
        base_params = {
            'task': tfdf.keras.Task.REGRESSION,
            'random_seed': Config.RANDOM_STATE
        }
        
        if model_type == 'tfdf_random_forest':
            return {
                **base_params,
                'num_trees': params.get('n_estimators', 300),
                'max_depth': params.get('max_depth', 16),
                'min_examples': params.get('min_samples_split', 5),
            }
        elif model_type == 'tfdf_gradient_boosted_trees':
            return {
                **base_params,
                'num_trees': params.get('n_estimators', 300),
                'max_depth': params.get('max_depth', 6),
                'learning_rate': params.get('learning_rate', 0.1),
                'shrinkage': params.get('shrinkage', 0.1),
            }
        elif model_type == 'tfdf_cart':
            return {
                **base_params,
                'max_depth': params.get('max_depth', 16),
                'min_examples': params.get('min_samples_split', 5),
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
        Train TF-DF model and evaluate performance
        
        Args:
            X_train: Training features
            y_train: Training targets
            X_test: Test features
            y_test: Test targets
            feature_names: List of feature names
            
        Returns:
            Dictionary with model metrics
        """
        self.feature_names = feature_names or [f'feature_{i}' for i in range(X_train.shape[1])]
        
        # Convert to pandas DataFrame (TF-DF works better with DataFrames)
        train_df = pd.DataFrame(X_train, columns=self.feature_names)
        train_df['target'] = y_train
        
        test_df = pd.DataFrame(X_test, columns=self.feature_names)
        test_df['target'] = y_test
        
        # Convert to TensorFlow datasets
        train_ds = tfdf.keras.pd_dataframe_to_tf_dataset(
            train_df, 
            label='target',
            task=tfdf.keras.Task.REGRESSION
        )
        
        test_ds = tfdf.keras.pd_dataframe_to_tf_dataset(
            test_df,
            label='target', 
            task=tfdf.keras.Task.REGRESSION
        )
        
        # Initialize model
        model_class = getattr(tfdf.keras, self.MODELS[self.model_type])
        self.model = model_class(**self.hyperparameters)
        self.model.compile(metrics=['mse'])
        
        # Train model
        print(f"🌲 Training {self.model_type}...")
        self.model.fit(train_ds, verbose=0)
        
        # Make predictions
        train_pred_df = pd.DataFrame(X_train, columns=self.feature_names)
        test_pred_df = pd.DataFrame(X_test, columns=self.feature_names)
        
        train_pred_ds = tfdf.keras.pd_dataframe_to_tf_dataset(
            train_pred_df,
            task=tfdf.keras.Task.REGRESSION
        )
        test_pred_ds = tfdf.keras.pd_dataframe_to_tf_dataset(
            test_pred_df,
            task=tfdf.keras.Task.REGRESSION
        )
        
        train_predictions = self.model.predict(train_pred_ds).flatten()
        test_predictions = self.model.predict(test_pred_ds).flatten()
        
        # Calculate metrics
        from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
        
        metrics = {
            'train_r2': float(r2_score(y_train, train_predictions)),
            'train_rmse': float(np.sqrt(mean_squared_error(y_train, train_predictions))),
            'train_mae': float(mean_absolute_error(y_train, train_predictions)),
            'test_r2': float(r2_score(y_test, test_predictions)),
            'test_rmse': float(np.sqrt(mean_squared_error(y_test, test_predictions))),
            'test_mae': float(mean_absolute_error(y_test, test_predictions)),
            'num_trees': self.hyperparameters.get('num_trees', 1),
            'oob_available': hasattr(self.model, 'make_inspector')
        }
        
        # Add OOB metrics if available (Random Forest)
        if self.model_type == 'tfdf_random_forest' and hasattr(self.model, 'make_inspector'):
            try:
                inspector = self.model.make_inspector()
                evaluation = inspector.evaluation()
                if hasattr(evaluation, 'rmse'):
                    metrics['oob_rmse'] = float(evaluation.rmse)
            except:
                pass
        
        return metrics
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """Make predictions using trained TF-DF model"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Convert to DataFrame
        pred_df = pd.DataFrame(X, columns=self.feature_names)
        pred_ds = tfdf.keras.pd_dataframe_to_tf_dataset(
            pred_df,
            task=tfdf.keras.Task.REGRESSION
        )
        
        return self.model.predict(pred_ds).flatten()
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from TF-DF model"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        try:
            inspector = self.model.make_inspector()
            importances = inspector.variable_importances()
            
            # Get NUM_AS_ROOT importance (most common)
            if 'NUM_AS_ROOT' in importances:
                importance_list = importances['NUM_AS_ROOT']
                return {
                    vi[0].name: float(vi[1]) 
                    for vi in importance_list
                }
        except Exception as e:
            print(f"Warning: Could not extract feature importance: {e}")
        
        return {}
    
    def save_model(self, model_run_id: str) -> str:
        """Save trained TF-DF model to disk"""
        if self.model is None:
            raise ValueError("Model not trained yet")
        
        # Create model directory
        model_dir = os.path.join(
            Config.MODEL_STORAGE_PATH,
            f"{model_run_id}_{self.model_type}"
        )
        os.makedirs(model_dir, exist_ok=True)
        
        # Save TF-DF model
        self.model.save(model_dir)
        
        # Save metadata separately
        metadata_path = os.path.join(model_dir, 'metadata.joblib')
        metadata = {
            'model_type': self.model_type,
            'hyperparameters': self.hyperparameters,
            'feature_names': self.feature_names
        }
        joblib.dump(metadata, metadata_path)
        
        return model_dir
    
    @staticmethod
    def load_model(model_run_id: str, model_type: str) -> 'TFDFModelTrainer':
        """Load trained TF-DF model from disk"""
        if not TFDF_AVAILABLE:
            raise ImportError("TensorFlow Decision Forests not available")
        
        model_dir = os.path.join(
            Config.MODEL_STORAGE_PATH,
            f"{model_run_id}_{model_type}"
        )
        
        if not os.path.exists(model_dir):
            raise FileNotFoundError(f"Model directory not found: {model_dir}")
        
        # Load metadata
        metadata_path = os.path.join(model_dir, 'metadata.joblib')
        metadata = joblib.load(metadata_path)
        
        # Create trainer instance
        trainer = TFDFModelTrainer(model_type, metadata['hyperparameters'])
        trainer.feature_names = metadata['feature_names']
        
        # Load TF-DF model
        trainer.model = tf.keras.models.load_model(model_dir)
        
        return trainer
