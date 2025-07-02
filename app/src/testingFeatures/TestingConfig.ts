// app/src/testingFeatures/TestingConfig.ts
export const TESTING_CONFIG = {
  // Change this to true to enable testing mode with fixed pedestrian
  USE_TESTING_MODE: false,
  USE_VEHICLE_TESTING_FEATURE: false,
  
  // Fixed pedestrian coordinates for testing [lat, lon]
  FIXED_PEDESTRIAN_COORDINATES: [35.03976474031546, -85.29206330487192] as [number, number],
} as const;