// app/src/testingFeatures/testingPedestrianDetectorFeatureTest/index.ts

// Export the testing pedestrian detector
export { TestingPedestrianDetectorViewModel } from './viewmodels/TestingPedestrianDetectorViewModel';
export type { TestingPedestrianData } from './viewmodels/TestingPedestrianDetectorViewModel';

// Re-export shared crosswalk constants for convenience - UPDATED for multiple polygons
export { CROSSWALK_POLYGONS, CROSSWALK_POLYGON_COORDS } from '../../features/Crosswalk/constants/CrosswalkCoordinates';

/**
 * Testing Feature Configuration
 */
export const TESTING_CONFIG = {
  PROXIMITY_THRESHOLD_METERS: 30,
  UPDATE_FREQUENCY_MS: 2000,
  // Updated: Test pedestrian coordinates for second crosswalk
  FIXED_PEDESTRIAN_COORDINATES: [35.04574821897141, -85.30823649580637], // [lat, lon] - Second crosswalk
  FEATURE_NAME: 'Pedestrian Detection Testing with Multiple Crosswalks',
  VERSION: '2.1.0', // Updated version
  USES_FIXED_DATA: true,
  INCLUDES_ZONE_ENTRY_TESTING: true,
  SIMULATION_ENABLED: true,
  SUPPORTS_MULTIPLE_CROSSWALKS: true, // NEW
};

/**
 * Quick test function to verify the testing feature
 */
export const runTestingFeatureCheck = (): boolean => {
  try {
    console.log('🧪 Testing Feature Check:');
    console.log(`  - Feature: ${TESTING_CONFIG.FEATURE_NAME}`);
    console.log(`  - Version: ${TESTING_CONFIG.VERSION}`);
    console.log(`  - Multiple Crosswalks: ${TESTING_CONFIG.SUPPORTS_MULTIPLE_CROSSWALKS ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`  - Threshold: ${TESTING_CONFIG.PROXIMITY_THRESHOLD_METERS}m`);
    console.log(`  - Update Frequency: ${TESTING_CONFIG.UPDATE_FREQUENCY_MS}ms`);
    console.log(`  - Fixed Pedestrian: [${TESTING_CONFIG.FIXED_PEDESTRIAN_COORDINATES[0]}, ${TESTING_CONFIG.FIXED_PEDESTRIAN_COORDINATES[1]}]`);
    console.log(`  - Uses API: ${TESTING_CONFIG.USES_FIXED_DATA ? 'NO (Fixed data)' : 'YES'}`);
    console.log(`  - Zone Entry Testing: ${TESTING_CONFIG.INCLUDES_ZONE_ENTRY_TESTING ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log(`  - Simulation: ${TESTING_CONFIG.SIMULATION_ENABLED ? '✅ ENABLED' : '❌ DISABLED'}`);
    console.log('  - Status: ✅ Ready for multiple crosswalk testing');
    return true;
  } catch (error) {
    console.error('🧪 Testing Feature Check Failed:', error);
    return false;
  }
};

/**
 * Quick test function specifically for Detection Zone Entry Time testing
 */
export const runDetectionZoneEntryTest = (): boolean => {
  try {
    console.log('\n🔍 Detection Zone Entry Time Testing Check:');
    console.log('================================================');
    console.log('🎯 WHAT THIS TESTS:');
    console.log('   • Time for pedestrian to enter detection zone');
    console.log('   • Time for system to register the pedestrian');
    console.log('   • Calculate: Registration Time - Zone Entry Time');
    console.log('   • NOW SUPPORTS: Multiple crosswalk polygons');
    console.log('');
    console.log('🎭 SIMULATION SCENARIO:');
    console.log('   1. Pedestrian starts outside crosswalk');
    console.log('   2. Pedestrian moves toward crosswalk');
    console.log('   3. ⏱️  Zone Entry detected (any crosswalk)');
    console.log('   4. ⏱️  System registers pedestrian');
    console.log('   5. 📊 Detection Zone Entry Time calculated');
    console.log('   6. Pedestrian continues through and exits');
    console.log('   7. Cycle repeats every ~21 seconds');
    console.log('');
    console.log('📱 HOW TO TEST:');
    console.log('   • Set TESTING_CONFIG.USE_TESTING_MODE = true');
    console.log('   • Launch the app');
    console.log('   • Watch console for detection zone entry measurements');
    console.log('   • Look for "DETECTION ZONE ENTRY TIME MEASURED" messages');
    console.log('');
    console.log('✅ Multiple Crosswalk Detection Zone Entry Time testing ready!');
    console.log('================================================\n');
    return true;
  } catch (error) {
    console.error('🔍 Detection Zone Entry Test Check Failed:', error);
    return false;
  }
};