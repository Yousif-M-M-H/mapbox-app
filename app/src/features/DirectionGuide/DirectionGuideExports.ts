// Import directly rather than re-exporting
import { CAR_POSITION } from '../Crosswalk/constants/CrosswalkCoordinates';
import { DirectionGuideViewModel } from './viewModels/DirectionGuideViewModel';
import { 
  MLK_INTERSECTION_ID, 
  MLK_INTERSECTION_NAME, 
  MLK_INTERSECTION_POSITION 
} from './constants/TestConstants';

// Export the main models, services, and viewmodels
export * from './models/DirectionTypes';
export * from './models/IntersectionData';
export * from './services/MapDataService';
export * from './utils/DirectionUtils';

// Export constants for convenience
export {
  MLK_INTERSECTION_ID,
  MLK_INTERSECTION_NAME,
  MLK_INTERSECTION_POSITION
};

/**
 * Run a test of the Direction Guide feature
 * This function can be imported and called from anywhere in the app to test the feature
 * 
 * Example usage:
 * ```
 * import { testDirectionGuide } from '@/src/features/DirectionGuide/DirectionGuideExports';
 * 
 * // In a component or screen:
 * useEffect(() => {
 *   testDirectionGuide();
 * }, []);
 * ```
 */
export const testDirectionGuide = async (): Promise<void> => {
  try {
    console.log('\n======== TESTING DIRECTION GUIDE FEATURE ========');
    console.log('Using fixed car position for testing');
    console.log(`Car Position: [${CAR_POSITION[0]}, ${CAR_POSITION[1]}]`);
    
    // Run the test using the ViewModel's runTest method
    await DirectionGuideViewModel.runTest();
    
    console.log('Direction Guide test completed successfully');
    console.log('=================================================\n');
  } catch (error: unknown) {
    console.error('Direction Guide test failed:', error);
  }
};

/**
 * Create and initialize a DirectionGuideViewModel
 * This is useful for integrating the feature with a UI component
 */
export const createDirectionGuideViewModel = (): DirectionGuideViewModel => {
  const viewModel = new DirectionGuideViewModel();
  viewModel.initialize().catch((error: unknown) => {
    console.error('Failed to initialize DirectionGuideViewModel:', error);
  });
  return viewModel;
};