// app/src/features/ClosestIntersection/index.ts

import { ClosestIntersectionViewModel } from './viewmodels/ClosestIntersectionViewModel';

// Main exports
export { ClosestIntersectionViewModel } from './viewmodels/ClosestIntersectionViewModel';
export { DistanceCalculationService } from './services/DistanceCalculationService';
export { INTERSECTIONS } from './constants/IntersectionDefinitions';

// Type exports
export type {
  Intersection,
  LocationWithHeading,
  DistanceResult,
  ClosestIntersectionResult
} from './models/IntersectionTypes';

// Configuration
export const CLOSEST_INTERSECTION_CONFIG = {
  FEATURE_NAME: 'Closest Intersection Monitor',
  VERSION: '1.0.0',
  UPDATE_FREQUENCY_MS: 1000,
  DESCRIPTION: 'Monitors and logs the closest intersection every second'
};

/**
 * Quick setup function
 */
export const createClosestIntersectionMonitor = (): ClosestIntersectionViewModel => {
  return new ClosestIntersectionViewModel();
};