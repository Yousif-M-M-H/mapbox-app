// app/src/features/SpatService/index.ts
// Clean exports for the refactored SpatService

// ========================================
// Main ViewModel (Primary Interface)
// ========================================
export { SpatViewModel } from './viewModels/SpatViewModel';

// ========================================
// Individual Managers (Advanced Use)
// ========================================
export { SpatDataManager } from './viewModels/SpatDataManager';
export { SpatMonitoringManager } from './viewModels/SpatMonitoringManager';
export { SpatSignalManager } from './viewModels/SpatSignalManager';
export { SpatUIStateManager } from './viewModels/SpatUIStateManager';

// ========================================
// Services
// ========================================
export { SpatApiService } from './services/SpatApiService';
export { DataMappingService } from './services/DataMappingService';
export { SignalStateService } from './services/SignalStateService';
export { TimingCalculationService } from './services/TimingCalculationService';

// ========================================
// Error Handling
// ========================================
export { SpatErrorHandler } from './errorHandling/SpatErrorHandler';

// ========================================
// Integration Layer
// ========================================
export { SpatIntegration } from './SpatIntegration';

// ========================================
// Models and Types
// ========================================
export type { 
  SpatData, 
  SignalState, 
  LaneSignalStatus, 
  ApproachSignalStatus,
  PhaseTimingInfo 
} from './models/SpatModels';

// ========================================
// UI Components
// ========================================
export { 
  SpatIcon, 
  SpatStatusBadge, 
  SpatStatusDisplay as SpatComponents 
} from './views/SpatComponents';
export { SpatStatusDisplay } from './views/SpatStatusDisplay';

// ========================================
// Usage Guide
// ========================================

/**
 * Most features should use only SpatViewModel:
 * 
 * ```typescript
 * import { SpatViewModel } from '@/src/features/SpatService';
 * 
 * const spatViewModel = new SpatViewModel();
 * await spatViewModel.startMonitoringApproach(id, name, lanes, data);
 * const signalState = spatViewModel.approachSignalState;
 * ```
 * 
 * Individual managers are available for advanced use cases:
 * - Custom data handling
 * - Testing purposes
 * - Custom integrations
 */