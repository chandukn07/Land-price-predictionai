import { Features, LandPrice } from '../types';

export interface ProcessedData {
  features: number[][];
  targets: number[];
  featureNames: string[];
  gridCellIds: string[];
  dates: string[];
}

export interface NormalizationStats {
  means: number[];
  stds: number[];
  mins: number[];
  maxs: number[];
}

export const FEATURE_FIELDS = [
  'building_density',
  'population_density',
  'avg_building_height',
  'commercial_ratio',
  'residential_ratio',
  'distance_to_station',
  'distance_to_highway',
  'distance_to_city_center',
  'school_count',
  'hospital_count',
  'park_area',
  'road_density',
  'public_transport_access',
  'crime_rate',
  'employment_rate'
] as const;

export function extractFeatures(
  featuresData: Features[],
  landPrices: LandPrice[],
  selectedFeatures?: string[]
): ProcessedData {
  const priceMap = new Map(
    landPrices.map(p => [`${p.grid_cell_id}_${p.assessment_date}`, p.price])
  );

  const featuresToUse = selectedFeatures || FEATURE_FIELDS;
  const processedRows: {
    features: number[];
    target: number;
    gridCellId: string;
    date: string;
  }[] = [];

  for (const feature of featuresData) {
    const key = `${feature.grid_cell_id}_${feature.assessment_date}`;
    const price = priceMap.get(key);

    if (price === undefined) continue;

    const featureVector: number[] = [];
    let hasNullValues = false;

    for (const field of featuresToUse) {
      const value = feature[field as keyof Features];

      if (value === null || value === undefined) {
        hasNullValues = true;
        break;
      }

      featureVector.push(Number(value));
    }

    if (!hasNullValues && featureVector.length === featuresToUse.length) {
      processedRows.push({
        features: featureVector,
        target: price,
        gridCellId: feature.grid_cell_id,
        date: feature.assessment_date
      });
    }
  }

  return {
    features: processedRows.map(r => r.features),
    targets: processedRows.map(r => r.target),
    featureNames: featuresToUse as unknown as string[],
    gridCellIds: processedRows.map(r => r.gridCellId),
    dates: processedRows.map(r => r.date)
  };
}

export function handleMissingValues(
  features: number[][],
  strategy: 'mean' | 'median' | 'zero' = 'mean'
): number[][] {
  if (features.length === 0) return features;

  const numFeatures = features[0].length;
  const filledFeatures = features.map(row => [...row]);

  for (let colIdx = 0; colIdx < numFeatures; colIdx++) {
    const columnValues = features
      .map(row => row[colIdx])
      .filter(val => !isNaN(val) && val !== null && val !== undefined);

    if (columnValues.length === 0) continue;

    let fillValue: number;
    if (strategy === 'mean') {
      fillValue = columnValues.reduce((a, b) => a + b, 0) / columnValues.length;
    } else if (strategy === 'median') {
      const sorted = [...columnValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      fillValue = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
    } else {
      fillValue = 0;
    }

    for (let rowIdx = 0; rowIdx < filledFeatures.length; rowIdx++) {
      if (
        isNaN(filledFeatures[rowIdx][colIdx]) ||
        filledFeatures[rowIdx][colIdx] === null ||
        filledFeatures[rowIdx][colIdx] === undefined
      ) {
        filledFeatures[rowIdx][colIdx] = fillValue;
      }
    }
  }

  return filledFeatures;
}

export function normalizeFeatures(
  features: number[][],
  method: 'zscore' | 'minmax' = 'zscore'
): { normalized: number[][]; stats: NormalizationStats } {
  if (features.length === 0) {
    return {
      normalized: features,
      stats: { means: [], stds: [], mins: [], maxs: [] }
    };
  }

  const numFeatures = features[0].length;
  const normalized = features.map(row => [...row]);
  const stats: NormalizationStats = {
    means: [],
    stds: [],
    mins: [],
    maxs: []
  };

  for (let colIdx = 0; colIdx < numFeatures; colIdx++) {
    const column = features.map(row => row[colIdx]);
    const mean = column.reduce((a, b) => a + b, 0) / column.length;
    const min = Math.min(...column);
    const max = Math.max(...column);

    stats.means.push(mean);
    stats.mins.push(min);
    stats.maxs.push(max);

    if (method === 'zscore') {
      const variance = column.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / column.length;
      const std = Math.sqrt(variance);
      stats.stds.push(std);

      if (std > 0) {
        for (let rowIdx = 0; rowIdx < normalized.length; rowIdx++) {
          normalized[rowIdx][colIdx] = (normalized[rowIdx][colIdx] - mean) / std;
        }
      }
    } else {
      stats.stds.push(0);
      const range = max - min;
      if (range > 0) {
        for (let rowIdx = 0; rowIdx < normalized.length; rowIdx++) {
          normalized[rowIdx][colIdx] = (normalized[rowIdx][colIdx] - min) / range;
        }
      }
    }
  }

  return { normalized, stats };
}

export function calculateCorrelation(
  features: number[][],
  targets: number[]
): { featureIndex: number; correlation: number }[] {
  const numFeatures = features[0]?.length || 0;
  const correlations: { featureIndex: number; correlation: number }[] = [];

  const targetMean = targets.reduce((a, b) => a + b, 0) / targets.length;
  const targetStd = Math.sqrt(
    targets.reduce((sum, val) => sum + Math.pow(val - targetMean, 2), 0) / targets.length
  );

  for (let colIdx = 0; colIdx < numFeatures; colIdx++) {
    const column = features.map(row => row[colIdx]);
    const featureMean = column.reduce((a, b) => a + b, 0) / column.length;
    const featureStd = Math.sqrt(
      column.reduce((sum, val) => sum + Math.pow(val - featureMean, 2), 0) / column.length
    );

    if (featureStd === 0 || targetStd === 0) {
      correlations.push({ featureIndex: colIdx, correlation: 0 });
      continue;
    }

    let covariance = 0;
    for (let i = 0; i < column.length; i++) {
      covariance += (column[i] - featureMean) * (targets[i] - targetMean);
    }
    covariance /= column.length;

    const correlation = covariance / (featureStd * targetStd);
    correlations.push({ featureIndex: colIdx, correlation: Math.abs(correlation) });
  }

  return correlations.sort((a, b) => b.correlation - a.correlation);
}

export function selectTopFeatures(
  features: number[][],
  targets: number[],
  featureNames: string[],
  topN: number = 10
): { selectedFeatures: number[][]; selectedNames: string[]; indices: number[] } {
  const correlations = calculateCorrelation(features, targets);
  const topIndices = correlations.slice(0, topN).map(c => c.featureIndex);

  const selectedFeatures = features.map(row =>
    topIndices.map(idx => row[idx])
  );

  const selectedNames = topIndices.map(idx => featureNames[idx]);

  return {
    selectedFeatures,
    selectedNames,
    indices: topIndices
  };
}

export function splitTrainTest(
  features: number[][],
  targets: number[],
  testSize: number = 0.2,
  shuffle: boolean = true
): {
  trainFeatures: number[][];
  trainTargets: number[];
  testFeatures: number[][];
  testTargets: number[];
} {
  const indices = Array.from({ length: features.length }, (_, i) => i);

  if (shuffle) {
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
  }

  const splitIndex = Math.floor(features.length * (1 - testSize));
  const trainIndices = indices.slice(0, splitIndex);
  const testIndices = indices.slice(splitIndex);

  return {
    trainFeatures: trainIndices.map(i => features[i]),
    trainTargets: trainIndices.map(i => targets[i]),
    testFeatures: testIndices.map(i => features[i]),
    testTargets: testIndices.map(i => targets[i])
  };
}

export function calculateMetrics(predictions: number[], actuals: number[]): {
  r2: number;
  rmse: number;
  mae: number;
} {
  const n = predictions.length;

  const mae = predictions.reduce((sum, pred, i) =>
    sum + Math.abs(pred - actuals[i]), 0) / n;

  const mse = predictions.reduce((sum, pred, i) =>
    sum + Math.pow(pred - actuals[i], 2), 0) / n;
  const rmse = Math.sqrt(mse);

  const actualMean = actuals.reduce((a, b) => a + b, 0) / n;
  const totalSS = actuals.reduce((sum, actual) =>
    sum + Math.pow(actual - actualMean, 2), 0);
  const residualSS = predictions.reduce((sum, pred, i) =>
    sum + Math.pow(actuals[i] - pred, 2), 0);
  const r2 = 1 - (residualSS / totalSS);

  return { r2, rmse, mae };
}

export function validateDataQuality(data: ProcessedData): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (data.features.length === 0) {
    issues.push('No feature data available');
  }

  if (data.targets.length === 0) {
    issues.push('No target data available');
  }

  if (data.features.length !== data.targets.length) {
    issues.push('Feature and target counts do not match');
  }

  if (data.features.length > 0) {
    const hasNaN = data.features.some(row => row.some(val => isNaN(val)));
    if (hasNaN) {
      issues.push('Features contain NaN values');
    }

    const hasInfinity = data.features.some(row => row.some(val => !isFinite(val)));
    if (hasInfinity) {
      issues.push('Features contain infinite values');
    }
  }

  if (data.targets.some(val => isNaN(val) || !isFinite(val))) {
    issues.push('Targets contain invalid values');
  }

  if (data.features.length < 10) {
    issues.push('Insufficient data for training (minimum 10 samples recommended)');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
