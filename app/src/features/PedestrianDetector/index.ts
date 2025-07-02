// app/src/features/PedestrianDetector/index.ts
// Clean exports for the refactored PedestrianDetector feature

// ========================================
// Main ViewModel (Primary Interface)
// ========================================
export { PedestrianDetectorViewModel } from './viewmodels/PedestrianDetectorViewModel';

// ========================================
// Individual Managers (Advanced Use)
// ========================================
export { PedestrianDataManager } from './viewmodels/PedestrianDataManager';
export { PedestrianMonitoringManager } from './viewmodels/PedestrianMonitoringManager';

// ========================================
// Services
// ========================================
export { CrosswalkDetectionService } from './services/CrosswalkDetectionService';
export { ProximityDetectionService } from './services/ProximityDetectionService';
export { PedestrianWarningService } from './services/PedestrianWarningService';

// ========================================
// Error Handling
// ========================================
export { PedestrianErrorHandler } from './errorHandling/PedestrianErrorHandler';

// ========================================
// Types and Interfaces
// ========================================
export type { PedestrianData } from './viewmodels/PedestrianDataManager';
export type { PedestrianAlert } from './services/PedestrianWarningService';

// ========================================
// UI Components (if needed by other features)
// ========================================
export { SimpleLine } from './views/components/SimpleLine';

// ========================================
// Re-export from related features for convenience
// ========================================
export { CROSSWALK_POLYGON_COORDS } from '../Crosswalk/constants/CrosswalkCoordinates';

/**
 * Usage Guide:
 * 
 * Most features should use only PedestrianDetectorViewModel:
 * 
 * ```typescript
 * import { PedestrianDetectorViewModel } from '@/src/features/PedestrianDetector';
 * 
 * const pedestrianDetector = new PedestrianDetectorViewModel();
 * pedestrianDetector.startMonitoring();
 * const pedestriansInCrosswalk = pedestrianDetector.pedestriansInCrosswalk;
 * ```
 * 
 * Individual services are available for advanced use cases:
 * - Custom detection algorithms
 * - Testing purposes
 * - Custom integrations
 * 
 * Architecture Benefits:
 * - Clean separation between data, detection, and monitoring
 * - Easy to test individual components
 * - Extensible for different detection scenarios
 * - Proper error handling throughout
 */