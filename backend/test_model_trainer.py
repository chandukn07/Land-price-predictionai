import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from models.ml_models import ModelTrainer


def test_model_trainer_normalizes_xg_boost_and_random_forrest_aliases():
    xgboost_trainer = ModelTrainer('xg boost', {})
    random_forest_trainer = ModelTrainer('random forrest', {})

    assert xgboost_trainer.model_type == 'xgboost'
    assert random_forest_trainer.model_type == 'random_forest'
