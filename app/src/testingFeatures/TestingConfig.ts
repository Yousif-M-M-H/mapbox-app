// app/src/testingFeatures/TestingConfig.ts

/**
 * 🧪 TESTING FEATURES CONFIGURATION
 * 
 * Change these boolean values to enable/disable testing features
 */
export const TESTING_CONFIG = {
  // Pedestrian detection testing (30m threshold vs 10m production)
  USE_TESTING_MODE: false,
  
  // Live vehicle display from SDSM data
  USE_VEHICLE_TESTING_FEATURE: false,
  
  // Future testing features can be added here
  // USE_TRAFFIC_LIGHT_TESTING: false,
  // USE_SPEED_TESTING: false,
} as const;

/**
 * Helper function to log current testing configuration
 */
export const logTestingConfig = (): void => {
  console.log('🧪 Testing Features Configuration:');
  console.log(`  - Pedestrian Testing Mode: ${TESTING_CONFIG.USE_TESTING_MODE ? 'ENABLED' : 'DISABLED'}`);
  console.log(`  - Vehicle Display Feature: ${TESTING_CONFIG.USE_VEHICLE_TESTING_FEATURE ? 'ENABLED' : 'DISABLED'}`);
  console.log('  - Change settings in: testingFeatures/TestingConfig.ts');
};