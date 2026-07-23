"""
Dataset Converter Utility
Converts various dataset formats (House Prices, Land Prices, etc.) to unified format
"""
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime


class DatasetConverter:
    """Convert different dataset formats to unified schema"""
    
    # Map Kaggle House Prices features to standardized names
    HOUSE_PRICES_MAPPING = {
        # Numerical features that map well
        'LotArea': 'lot_area',
        'OverallQual': 'overall_quality',
        'OverallCond': 'overall_condition',
        'YearBuilt': 'year_built',
        'YearRemodAdd': 'year_remodeled',
        'GrLivArea': 'living_area',
        'FullBath': 'full_bathrooms',
        'HalfBath': 'half_bathrooms',
        'BedroomAbvGr': 'bedrooms',
        'TotRmsAbvGrd': 'total_rooms',
        'GarageCars': 'garage_capacity',
        'GarageArea': 'garage_area',
        'SalePrice': 'price'
    }
    
    @staticmethod
    def detect_dataset_type(df: pd.DataFrame) -> str:
        """
        Detect dataset type based on columns
        
        Args:
            df: Input dataframe
            
        Returns:
            Dataset type: 'house_prices', 'land_prices', or 'unknown'
        """
        columns = set(df.columns.str.lower())
        
        # Check for Kaggle House Prices dataset
        house_price_indicators = {'saleprice', 'lotarea', 'overallqual', 'grlivarea'}
        if len(house_price_indicators.intersection(columns)) >= 3:
            return 'house_prices'
        
        # Check for Land Prices dataset
        land_price_indicators = {'building_density', 'population_density', 'grid_cell_id'}
        if len(land_price_indicators.intersection(columns)) >= 2:
            return 'land_prices'
        
        return 'unknown'
    
    @staticmethod
    def convert_house_prices_to_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Convert Kaggle House Prices dataset to feature format
        
        Args:
            df: House prices dataframe
            
        Returns:
            Tuple of (features_df, prices_df)
        """
        # Create a copy
        data = df.copy()
        
        # Generate grid_cell_id if not present
        if 'Id' in data.columns:
            data['grid_cell_id'] = 'HP_' + data['Id'].astype(str).str.zfill(6)
        else:
            data['grid_cell_id'] = 'HP_' + pd.Series(range(len(data))).astype(str).str.zfill(6)
        
        # Add assessment_date
        if 'YrSold' in data.columns and 'MoSold' in data.columns:
            data['assessment_date'] = pd.to_datetime(
                data['YrSold'].astype(str) + '-' + data['MoSold'].astype(str).str.zfill(2) + '-01',
                errors='coerce'
            )
        else:
            data['assessment_date'] = datetime.now()
        
        # Extract price
        price_column = None
        for col in ['SalePrice', 'saleprice', 'price']:
            if col in data.columns:
                price_column = col
                break
        
        if price_column:
            prices_df = pd.DataFrame({
                'grid_cell_id': data['grid_cell_id'],
                'assessment_date': data['assessment_date'],
                'price': data[price_column]
            })
        else:
            prices_df = pd.DataFrame()
        
        # Engineer features from house price data
        features = {
            'grid_cell_id': data['grid_cell_id'],
            'assessment_date': data['assessment_date'],
        }
        
        # Normalize and create 15 features for compatibility
        # 1. Building Density (from lot coverage)
        if 'LotArea' in data.columns and 'GrLivArea' in data.columns:
            features['building_density'] = (data['GrLivArea'] / data['LotArea']).fillna(0).clip(0, 1)
        else:
            features['building_density'] = 0.5
        
        # 2. Population Density (estimate from bedrooms and lot area)
        if 'BedroomAbvGr' in data.columns and 'LotArea' in data.columns:
            features['population_density'] = (data['BedroomAbvGr'] * 2.5 / (data['LotArea'] / 43560)).fillna(100)
        else:
            features['population_density'] = 1000
        
        # 3. Average Building Height (estimate from stories)
        if 'HouseStyle' in data.columns:
            story_map = {'1Story': 10, '1.5Fin': 15, '1.5Unf': 12, '2Story': 20, '2.5Fin': 25, '2.5Unf': 22, 'SFoyer': 15, 'SLvl': 15}
            features['avg_building_height'] = data['HouseStyle'].map(story_map).fillna(15)
        else:
            features['avg_building_height'] = 15
        
        # 4. Commercial Ratio (most houses are residential, use zoning)
        if 'MSZoning' in data.columns:
            commercial_zones = ['C (all)', 'RM', 'I (all)']
            features['commercial_ratio'] = data['MSZoning'].isin(commercial_zones).astype(float) * 0.8
        else:
            features['commercial_ratio'] = 0.0
        
        # 5. Residential Ratio
        features['residential_ratio'] = 1.0 - features['commercial_ratio']
        
        # 6. Distance to Station (estimate from neighborhood)
        # Assuming better neighborhoods are closer to amenities
        if 'Neighborhood' in data.columns:
            # High-value neighborhoods assumed closer to transit
            central_neighborhoods = ['NoRidge', 'NridgHt', 'StoneBr', 'Timber', 'Veenker']
            features['distance_to_station'] = np.where(
                data['Neighborhood'].isin(central_neighborhoods),
                np.random.uniform(0.5, 2.0, len(data)),
                np.random.uniform(2.0, 8.0, len(data))
            )
        else:
            features['distance_to_station'] = 3.0
        
        # 7. Distance to Highway
        if 'Condition1' in data.columns:
            near_road = data['Condition1'].isin(['Artery', 'Feedr'])
            features['distance_to_highway'] = np.where(near_road, 1.0, 5.0)
        else:
            features['distance_to_highway'] = 5.0
        
        # 8. Distance to City Center (inverse of overall quality/condition)
        if 'OverallQual' in data.columns:
            features['distance_to_city_center'] = 10 - (data['OverallQual'] * 0.8)
        else:
            features['distance_to_city_center'] = 5.0
        
        # 9. School Count (estimate from neighborhood quality)
        if 'OverallQual' in data.columns:
            features['school_count'] = (data['OverallQual'] / 2).clip(1, 5).round()
        else:
            features['school_count'] = 2
        
        # 10. Hospital Count
        features['hospital_count'] = 1  # Most areas have at least one
        
        # 11. Park Area (from lot features)
        if 'LotArea' in data.columns and 'GrLivArea' in data.columns:
            features['park_area'] = (data['LotArea'] - data['GrLivArea']).clip(0) / 100
        else:
            features['park_area'] = 100
        
        # 12. Road Density (from street and alley)
        if 'Street' in data.columns:
            features['road_density'] = data['Street'].map({'Pave': 0.9, 'Grvl': 0.5}).fillna(0.7)
        else:
            features['road_density'] = 0.7
        
        # 13. Public Transport Access (from condition and proximity)
        if 'Condition1' in data.columns:
            near_transport = data['Condition1'].isin(['RRAe', 'RRAn', 'RRNe', 'RRNn', 'PosA', 'PosN'])
            features['public_transport_access'] = np.where(near_transport, 0.9, 0.5)
        else:
            features['public_transport_access'] = 0.7
        
        # 14. Crime Rate (inverse of overall condition)
        if 'OverallCond' in data.columns:
            features['crime_rate'] = (10 - data['OverallCond']) / 50  # Lower is better
        else:
            features['crime_rate'] = 0.1
        
        # 15. Employment Rate (estimate from neighborhood)
        if 'Neighborhood' in data.columns:
            affluent_neighborhoods = ['NoRidge', 'NridgHt', 'StoneBr']
            features['employment_rate'] = np.where(
                data['Neighborhood'].isin(affluent_neighborhoods),
                0.95,
                0.85
            )
        else:
            features['employment_rate'] = 0.85
        
        features_df = pd.DataFrame(features)
        
        return features_df, prices_df
    
    @staticmethod
    def get_dataset_info(df: pd.DataFrame) -> Dict:
        """
        Get information about the dataset
        
        Args:
            df: Input dataframe
            
        Returns:
            Dictionary with dataset information
        """
        dataset_type = DatasetConverter.detect_dataset_type(df)
        
        return {
            'type': dataset_type,
            'rows': len(df),
            'columns': len(df.columns),
            'features': list(df.columns),
            'missing_values': df.isnull().sum().sum(),
            'numeric_columns': len(df.select_dtypes(include=[np.number]).columns),
            'categorical_columns': len(df.select_dtypes(include=['object']).columns)
        }
