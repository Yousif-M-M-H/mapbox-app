// app/src/testingFeatures/laneShiftTest/index.ts

// Export the main ViewModel and types
export { LaneShiftTestViewModel } from './viewmodels/LaneShiftTestViewModel';
export { MAPParserService } from './services/MAPParserService';
export { CoordinateParser } from './utils/CoordinateParser';
export type { ParsedLane, TestLaneData, MAPLane, MAPIntersection } from './models/LaneModels';

// Import required classes for the functions
import { LaneShiftTestViewModel } from './viewmodels/LaneShiftTestViewModel';
import { MAPParserService } from './services/MAPParserService';

/**
 * Lane Shift Test Configuration
 */
export const LANE_SHIFT_TEST_CONFIG = {
  FEATURE_NAME: 'Simple Line Test',
  VERSION: '1.0.0',
  TARGET_LANE_ID: 17,
  INTERSECTION_ID: 52349,
  DESCRIPTION: 'Test simple line rendering between two coordinates',
  PURPOSE: 'Verify basic line drawing functionality with Mapbox'
};

/**
 * Quick initialization function for the simple line test
 */
export const initializeLaneShiftTest = (): LaneShiftTestViewModel => {
  console.log(`🛣️ Initializing ${LANE_SHIFT_TEST_CONFIG.FEATURE_NAME}...`);
  console.log(`📍 Drawing line between two coordinates`);
  
  const viewModel = new LaneShiftTestViewModel();
  viewModel.initializeTest();
  
  return viewModel;
};

/**
 * Run a quick test of the lane parsing functionality
 */
export const runLaneShiftQuickTest = (): void => {
  console.log('\n🛣️ === SIMPLE LINE QUICK TEST ===');
  
  // Test coordinate conversion first
  console.log('🔍 Testing simple line coordinates:');
  console.log('  Point 1: [-85.3125954, 35.0459207]');
  console.log('  Point 2: [-85.3132786, 35.0448121]');
  console.log('  Expected: Blue line between these two points');
  
  // Run the actual parsing test
  const result = MAPParserService.parseTestLane();
  
  if (result.testStatus === 'success' && result.selectedLane) {
    console.log('✅ Test passed - Simple line data created successfully');
    console.log(`📍 Line has ${result.selectedLane.coordinates.length} coordinate points`);
  } else {
    console.log('❌ Test failed:', result.errorMessage);
  }
  console.log('=== QUICK TEST COMPLETE ===\n');
};