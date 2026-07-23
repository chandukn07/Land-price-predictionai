import os
from typing import Optional, Dict, Any
import pandas as pd

from database import db_session
from models.database_models import Dataset


def import_house_prices(csv_path: str, dataset_name: Optional[str] = None) -> Dict[str, Any]:
    """Import a Kaggle House Prices CSV into project data folder and create a Dataset record.

    This function does NOT attempt to map every Kaggle column into the project's Feature schema.
    Instead it saves a cleaned features CSV and a targets CSV (if SalePrice exists) into
    `backend/data/` and creates a Dataset row pointing to the imported data.

    Args:
        csv_path: Path to the raw Kaggle CSV file (absolute or relative to project root).
        dataset_name: Optional name for the dataset. Defaults to 'house_prices'.

    Returns:
        Dict with dataset_id and saved file paths.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    df = pd.read_csv(csv_path)

    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    data_dir = os.path.join(root_dir, 'data')
    os.makedirs(data_dir, exist_ok=True)

    name = dataset_name or 'house_prices'
    raw_path = os.path.join(data_dir, f"{name}_raw.csv")
    features_path = os.path.join(data_dir, f"{name}_features.csv")
    targets_path = os.path.join(data_dir, f"{name}_targets.csv")

    # Save raw
    df.to_csv(raw_path, index=False)

    # Split out target if available
    if 'SalePrice' in df.columns:
        targets = df[['Id', 'SalePrice']].copy()
        features = df.drop(columns=['SalePrice'])
    else:
        targets = None
        features = df.copy()

    features.to_csv(features_path, index=False)
    if targets is not None:
        targets.to_csv(targets_path, index=False)

    # Create Dataset DB entry
    session = db_session()
    dataset = Dataset(
        name=name,
        description='Imported from Kaggle House Prices CSV',
        record_count=len(df),
        status='ready'
    )
    session.add(dataset)
    session.commit()

    result = {
        'dataset_id': dataset.id,
        'record_count': len(df),
        'raw_path': raw_path,
        'features_path': features_path,
        'targets_path': targets_path if targets is not None else None
    }

    session.close()
    return result
