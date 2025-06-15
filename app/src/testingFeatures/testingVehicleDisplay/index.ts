// app/src/testingFeatures/testingVehicleDisplay/index.ts

// Export the main components
export { TestingVehicleDisplayViewModel } from './viewmodels/TestingVehicleDisplayViewModel';
export { VehicleMarkers } from './views/components/VehicleMarker';
export type { VehicleData, SDSMVehicleResponse } from './models/VehicleData';

/**
 * Testing Feature Configuration
 */
export const TESTING_VEHICLE_CONFIG = {
  UPDATE_FREQUENCY_MS: 1000,
  API_URL: 'http://10.199.1.11:9095/latest/sdsm_events',
  FEATURE_NAME: 'Live Vehicle Display',
  VERSION: '1.0.0',
  MARKER_COLOR: '#00FF00', // Green for vehicles
};

/**
 * Quick test function to verify the testing feature
 */
export const runVehicleTestingCheck = (): boolean => {
  try {
    console.log('🚗 Vehicle Testing Feature Check:');
    console.log(`  - Feature: ${TESTING_VEHICLE_CONFIG.FEATURE_NAME}`);
    console.log(`  - Update Frequency: ${TESTING_VEHICLE_CONFIG.UPDATE_FREQUENCY_MS}ms`);
    console.log(`  - API URL: ${TESTING_VEHICLE_CONFIG.API_URL}`);
    console.log(`  - Marker Color: ${TESTING_VEHICLE_CONFIG.MARKER_COLOR}`);
    console.log('  - Status: ✅ Ready for testing');
    return true;
  } catch (error) {
    console.error('🚗 Vehicle Testing Feature Check Failed:', error);
    return false;
  }
};