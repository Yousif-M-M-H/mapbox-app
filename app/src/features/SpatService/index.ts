// app/src/features/SpatService/index.ts
// Export main services and models
export { SpatDataService } from './services/SpatDataService';
export { SpatBusinessService } from './services/SpatBusinessService';
export { SpatViewModel } from './viewModels/SpatViewModel';
export { SpatIntegration } from './SpatIntegration';

// Export models and types
export type { SpatData, SignalState, LaneSignalStatus, ApproachSignalStatus } from './models/SpatModels';

// Export UI components
export { SpatIcon, SpatStatusBadge, SpatStatusDisplay as SpatComponents } from './views/SpatComponents';
export { SpatStatusDisplay } from './views/SpatStatusDisplay';