"""
Quick Test Script for House Prices Dataset Integration
Run this to test the dataset converter without needing TensorFlow
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
import numpy as np
from utils.dataset_converter import DatasetConverter


def create_sample_house_prices_data():
    """Create a small sample dataset that mimics Kaggle House Prices format"""
    np.random.seed(42)
    n_samples = 20
    
    data = {
        'Id': range(1, n_samples + 1),
        'MSZoning': np.random.choice(['RL', 'RM', 'C (all)', 'FV', 'RH'], n_samples),
        'LotArea': np.random.randint(5000, 15000, n_samples),
        'Street': np.random.choice(['Pave', 'Grvl'], n_samples),
        'Neighborhood': np.random.choice(['NoRidge', 'NridgHt', 'StoneBr', 'Timber', 'OldTown'], n_samples),
        'HouseStyle': np.random.choice(['1Story', '2Story', '1.5Fin', 'SLvl'], n_samples),
        'OverallQual': np.random.randint(4, 10, n_samples),
        'OverallCond': np.random.randint(4, 9, n_samples),
        'YearBuilt': np.random.randint(1960, 2010, n_samples),
        'YearRemodAdd': np.random.randint(1960, 2010, n_samples),
        'GrLivArea': np.random.randint(1000, 3000, n_samples),
        'FullBath': np.random.randint(1, 4, n_samples),
        'HalfBath': np.random.randint(0, 2, n_samples),
        'BedroomAbvGr': np.random.randint(2, 5, n_samples),
        'TotRmsAbvGrd': np.random.randint(5, 10, n_samples),
        'GarageCars': np.random.randint(1, 4, n_samples),
        'GarageArea': np.random.randint(300, 800, n_samples),
        'YrSold': np.random.choice([2006, 2007, 2008, 2009, 2010], n_samples),
        'MoSold': np.random.randint(1, 13, n_samples),
        'Condition1': np.random.choice(['Norm', 'Artery', 'Feedr', 'RRAe', 'PosN'], n_samples),
        'SalePrice': np.random.randint(100000, 500000, n_samples)
    }
    
    return pd.DataFrame(data)


def test_dataset_detection():
    """Test 1: Dataset type detection"""
    print("=" * 60)
    print("TEST 1: Dataset Type Detection")
    print("=" * 60)
    
    # Create sample data
    house_df = create_sample_house_prices_data()
    
    # Detect type
    dataset_type = DatasetConverter.detect_dataset_type(house_df)
    
    print(f"✅ Dataset detected as: {dataset_type}")
    print(f"   (Expected: 'house_prices')")
    
    if dataset_type == 'house_prices':
        print("   ✓ Detection successful!\n")
        return True
    else:
        print("   ✗ Detection failed!\n")
        return False


def test_dataset_info():
    """Test 2: Get dataset information"""
    print("=" * 60)
    print("TEST 2: Dataset Information Extraction")
    print("=" * 60)
    
    house_df = create_sample_house_prices_data()
    info = DatasetConverter.get_dataset_info(house_df)
    
    print(f"Dataset Type: {info['type']}")
    print(f"Rows: {info['rows']}")
    print(f"Columns: {info['columns']}")
    print(f"Numeric Columns: {info['numeric_columns']}")
    print(f"Categorical Columns: {info['categorical_columns']}")
    print(f"Missing Values: {info['missing_values']}")
    print("✅ Info extraction successful!\n")
    return True


def test_feature_conversion():
    """Test 3: Convert House Prices to Feature Format"""
    print("=" * 60)
    print("TEST 3: Feature Conversion (79 features → 15 features)")
    print("=" * 60)
    
    house_df = create_sample_house_prices_data()
    
    # Convert
    features_df, prices_df = DatasetConverter.convert_house_prices_to_features(house_df)
    
    print(f"Input shape: {house_df.shape}")
    print(f"Features output shape: {features_df.shape}")
    print(f"Prices output shape: {prices_df.shape}\n")
    
    # Verify all 15 features are present
    expected_features = [
        'grid_cell_id', 'assessment_date',
        'building_density', 'population_density', 'avg_building_height',
        'commercial_ratio', 'residential_ratio', 'distance_to_station',
        'distance_to_highway', 'distance_to_city_center', 'school_count',
        'hospital_count', 'park_area', 'road_density',
        'public_transport_access', 'crime_rate', 'employment_rate'
    ]
    
    missing_features = set(expected_features) - set(features_df.columns)
    if missing_features:
        print(f"❌ Missing features: {missing_features}")
        return False
    
    print("✅ All 15 features present!")
    print("\nFeature columns:")
    for i, col in enumerate(features_df.columns, 1):
        print(f"  {i:2d}. {col}")
    
    print("\n📊 Sample Feature Values (first 3 rows):")
    print(features_df.head(3).to_string())
    
    print("\n💰 Sample Prices (first 3 rows):")
    print(prices_df.head(3).to_string())
    
    print("\n✅ Conversion successful!\n")
    return True


def test_feature_ranges():
    """Test 4: Verify feature value ranges"""
    print("=" * 60)
    print("TEST 4: Feature Value Validation")
    print("=" * 60)
    
    house_df = create_sample_house_prices_data()
    features_df, _ = DatasetConverter.convert_house_prices_to_features(house_df)
    
    # Drop ID and date columns
    numeric_features = features_df.select_dtypes(include=[np.number])
    
    print("Feature Statistics:")
    print("=" * 60)
    
    for col in numeric_features.columns:
        min_val = numeric_features[col].min()
        max_val = numeric_features[col].max()
        mean_val = numeric_features[col].mean()
        print(f"{col:30s}: min={min_val:8.2f}, max={max_val:8.2f}, mean={mean_val:8.2f}")
    
    # Validate specific ranges
    validations = []
    
    # Building density should be 0-1
    if (features_df['building_density'] >= 0).all() and (features_df['building_density'] <= 1).all():
        validations.append(('building_density', '✓', '0-1 range'))
    else:
        validations.append(('building_density', '✗', 'out of range'))
    
    # Residential ratio should be 0-1
    if (features_df['residential_ratio'] >= 0).all() and (features_df['residential_ratio'] <= 1).all():
        validations.append(('residential_ratio', '✓', '0-1 range'))
    else:
        validations.append(('residential_ratio', '✗', 'out of range'))
    
    # Crime rate should be low (0-0.5)
    if (features_df['crime_rate'] >= 0).all() and (features_df['crime_rate'] <= 0.5).all():
        validations.append(('crime_rate', '✓', '0-0.5 range'))
    else:
        validations.append(('crime_rate', '✗', 'out of range'))
    
    print("\n" + "=" * 60)
    print("Validation Results:")
    print("=" * 60)
    for feature, status, desc in validations:
        print(f"{status} {feature:30s}: {desc}")
    
    all_valid = all(v[1] == '✓' for v in validations)
    if all_valid:
        print("\n✅ All validations passed!\n")
    else:
        print("\n⚠️  Some validations failed\n")
    
    return all_valid


def main():
    """Run all tests"""
    print("\n" + "🏡" * 30)
    print("HOUSE PRICES DATASET CONVERTER - TEST SUITE")
    print("🏡" * 30 + "\n")
    
    results = []
    
    # Run tests
    results.append(("Dataset Detection", test_dataset_detection()))
    results.append(("Dataset Info", test_dataset_info()))
    results.append(("Feature Conversion", test_feature_conversion()))
    results.append(("Feature Validation", test_feature_ranges()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    total_pass = sum(1 for _, passed in results if passed)
    print("\n" + "=" * 60)
    print(f"Total: {total_pass}/{len(results)} tests passed")
    print("=" * 60 + "\n")
    
    if total_pass == len(results):
        print("🎉 ALL TESTS PASSED! 🎉")
        print("\nYou can now:")
        print("  1. Upload real Kaggle House Prices CSV through your UI")
        print("  2. System will auto-detect and convert to 15 features")
        print("  3. Train with XGBoost, LightGBM, or any existing model")
        print("  4. Optional: Install TensorFlow for TF-DF models")
    else:
        print("⚠️  Some tests failed. Check the output above.")
    
    print("\n" + "🏡" * 30 + "\n")


if __name__ == "__main__":
    main()
