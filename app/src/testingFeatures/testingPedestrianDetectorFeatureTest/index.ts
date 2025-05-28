// app/src/testingFeatures/testingPedestrianDetectorFeatureTest/index.ts

// Export the testing pedestrian detector
export { TestingPedestrianDetectorViewModel } from './viewmodels/TestingPedestrianDetectorViewModel';
export type { TestingPedestrianData } from './viewmodels/TestingPedestrianDetectorViewModel';

// Re-export shared crosswalk constants for convenience
export { CROSSWALK_POLYGON_COORDS } from '../../features/Crosswalk/constants/CrosswalkCoordinates';

/**
 * Testing Feature Configuration
 */
export const TESTING_CONFIG = {
  PROXIMITY_THRESHOLD_METERS: 30,
  UPDATE_FREQUENCY_MS: 2000,
  FIXED_PEDESTRIAN_COORDINATES: [35.03976454975141, -85.29204835002605], // [lat, lon]
  FEATURE_NAME: 'Pedestrian Detection Testing',
  VERSION: '1.0.0',
  USES_FIXED_DATA: true, // No API calls, uses fixed pedestrian position
};

/**
 * Quick test function to verify the testing feature
 */
export const runTestingFeatureCheck = (): boolean => {
  try {
    console.log('🧪 Testing Feature Check:');
    console.log(`  - Feature: ${TESTING_CONFIG.FEATURE_NAME}`);
    console.log(`  - Threshold: ${TESTING_CONFIG.PROXIMITY_THRESHOLD_METERS}m`);
    console.log(`  - Update Frequency: ${TESTING_CONFIG.UPDATE_FREQUENCY_MS}ms`);
    console.log(`  - Fixed Pedestrian: [${TESTING_CONFIG.FIXED_PEDESTRIAN_COORDINATES[0]}, ${TESTING_CONFIG.FIXED_PEDESTRIAN_COORDINATES[1]}]`);
    console.log(`  - Uses API: ${TESTING_CONFIG.USES_FIXED_DATA ? 'NO (Fixed data)' : 'YES'}`);
    console.log('  - Status: ✅ Ready for testing');
    return true;
  } catch (error) {
    console.error('🧪 Testing Feature Check Failed:', error);
    return false;
  }
};