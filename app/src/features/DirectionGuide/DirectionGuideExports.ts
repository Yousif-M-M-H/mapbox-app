// Import directly rather than re-exporting
import { CAR_POSITION } from '../Crosswalk/constants/CrosswalkCoordinates';
import { DirectionGuideViewModel } from './viewModels/DirectionGuideViewModel';
import { 
  MLK_INTERSECTION_ID, 
  MLK_INTERSECTION_NAME, 
  MLK_INTERSECTION_CENTER
} from './constants/TestConstants';

// Export the main models, services, and viewmodels
export * from './models/DirectionTypes';
export * from './models/IntersectionData';
export * from './services/MapDataService';

// Export constants for convenience
export {
  MLK_INTERSECTION_ID,
  MLK_INTERSECTION_NAME,
  MLK_INTERSECTION_CENTER
};

/**
 * Run a test of the Direction Guide feature with hardcoded data
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
    console.log('Using hardcoded lane data (no API calls)');
    console.log(`Test Position: [${CAR_POSITION[0]}, ${CAR_POSITION[1]}]`);
    
    // Create a DirectionGuideViewModel and test it
    const viewModel = new DirectionGuideViewModel();
    await viewModel.initialize();
    
    // Test with the car position
    viewModel.setVehiclePosition(CAR_POSITION);
    
    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Log results
    if (viewModel.showTurnGuide) {
      const turns = viewModel.allowedTurns.filter(t => t.allowed).map(t => t.type);
      console.log(`✅ Test successful! Detected turns: ${turns.join(', ')}`);
    } else {
      console.log(`ℹ️ No turns detected at test position`);
    }
    
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