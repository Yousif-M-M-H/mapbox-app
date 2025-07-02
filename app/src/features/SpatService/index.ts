// app/src/features/SpatService/index.ts
// Clean exports for the refactored SpatService

// Export main services
export { SpatApiService } from './services/SpatApiService';
export { DataMappingService } from './services/DataMappingService';
export { SignalStateService } from './services/SignalStateService';
export { TimingCalculationService } from './services/TimingCalculationService';

// Export error handling
export { SpatErrorHandler } from './errorHandling/SpatErrorHandler';

// Export viewModel
export { SpatViewModel } from './viewModels/SpatViewModel';

// Export integration layer (updated to use new services)
export { SpatIntegration } from './SpatIntegration';

// Export models and types
export type { 
  SpatData, 
  SignalState, 
  LaneSignalStatus, 
  ApproachSignalStatus,
  PhaseTimingInfo 
} from './models/SpatModels';

// Export UI components
export { 
  SpatIcon, 
  SpatStatusBadge, 
  SpatStatusDisplay as SpatComponents 
} from './views/SpatComponents';
export { SpatStatusDisplay } from './views/SpatStatusDisplay';