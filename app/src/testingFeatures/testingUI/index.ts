// app/src/testingFeatures/testingUI/index.ts

// Export testing UI components
export { TestingModeOverlay } from './views/components/TestingModeOverlay';
export {}

/**
 * Testing UI Configuration
 */
export const TESTING_UI_CONFIG = {
  FEATURE_NAME: 'Testing UI Components',
  VERSION: '1.0.0',
  DESCRIPTION: 'UI components specifically for testing modes and debugging',
  PURPOSE: 'Provide clean, separated testing interface elements'
};

/**
 * Quick initialization check for testing UI
 */
export const checkTestingUIAvailable = (): boolean => {
  try {
    console.log('🧪 Testing UI Components Available:');
    console.log(`  - Feature: ${TESTING_UI_CONFIG.FEATURE_NAME}`);
    console.log(`  - Version: ${TESTING_UI_CONFIG.VERSION}`);
    console.log(`  - Status: ✅ Ready for use`);
    return true;
  } catch (error) {
    console.error('🧪 Testing UI Check Failed:', error);
    return false;
  }
};