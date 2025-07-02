// ========================================
// Import all modules first
// ========================================
import { DirectionGuideViewModel } from './viewModels/DirectionGuideViewModel';
import { LaneDetectionViewModel } from './viewModels/LaneDetectionViewModel';
import { VehiclePositionViewModel } from './viewModels/VehiclePositionViewModel';
import { MapDataService } from './services/MapDataService';
import { SpatIntegrationService } from './services/SpatIntegrationService';
import { TurnGuideDisplay } from './views/components/TurnGuideDisplay';
import {
  calculateHeading,
  headingToDirection,
  determineApproachDirection,
  logDirectionDetails,
} from './utils/DirectionUtils';
import {
  MLK_INTERSECTION_ID,
  MLK_INTERSECTION_NAME,
  MLK_INTERSECTION_CENTER,
  CAR_POSITION,
} from './constants/TestConstants';

// ========================================
// Models (Type-only exports)
// ========================================
export type {
  ApproachDirection,
  TurnType,
  AllowedTurn,
} from './models/DirectionTypes';

export type {
  MapEventData,
  MultiLaneMapData,
  ProcessedIntersectionData,
} from './models/IntersectionData';

export type {
  DetectedLane,
  LaneDetectionState,
  LaneDetectionConfig,
  LaneGroup,
} from './models/LaneDetectionModels';

// ========================================
// Services
// ========================================
export { MapDataService, SpatIntegrationService };

// ========================================
// ViewModels
// ========================================
export { DirectionGuideViewModel, LaneDetectionViewModel, VehiclePositionViewModel };

// ========================================
// Views
// ========================================
export { TurnGuideDisplay };

// ========================================
// Utils
// ========================================
export {
  calculateHeading,
  headingToDirection,
  determineApproachDirection,
  logDirectionDetails,
};

// ========================================
// Constants
// ========================================
export {
  MLK_INTERSECTION_ID,
  MLK_INTERSECTION_NAME,
  MLK_INTERSECTION_CENTER,
  CAR_POSITION,
};

// ========================================
// Convenience Functions
// ========================================

/**
 * Create and initialize a DirectionGuideViewModel
 * This is the main entry point for using the DirectionGuide feature
 */
export const createDirectionGuideViewModel = (): DirectionGuideViewModel => {
  console.log('🧭 Creating DirectionGuideViewModel...');
  return new DirectionGuideViewModel();
};

/**
 * Quick test function to verify the DirectionGuide feature
 */
export const testDirectionGuide = async (): Promise<void> => {
  try {
    console.log('\n======== TESTING DIRECTION GUIDE FEATURE ========');
    console.log('Testing refactored MVVM architecture');
    console.log(`Test Position: [${CAR_POSITION[0]}, ${CAR_POSITION[1]}]`);

    const viewModel = createDirectionGuideViewModel();
    viewModel.setVehiclePosition(CAR_POSITION);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (viewModel.showTurnGuide) {
      const turns = viewModel.allowedTurns.filter((t) => t.allowed).map((t) => t.type);
      console.log(`✅ Test successful! Detected turns: ${turns.join(', ')}`);
      console.log(`📍 Approach: ${viewModel.currentApproachName}`);
      console.log(`🛣️ Lanes: ${viewModel.currentLanes}`);
    } else {
      console.log(`ℹ️ No turns detected at test position`);
    }

    console.log('Direction Guide test completed successfully');
    console.log('=================================================\n');

    viewModel.cleanup();
  } catch (error: unknown) {
    console.error('Direction Guide test failed:', error);
  }
};
