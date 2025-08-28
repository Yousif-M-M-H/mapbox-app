// app/src/features/SDSM/index.ts
// Clean exports for the SDSM vehicle display feature

import { SDSMService } from './services/SDSMService';
import { VehicleDisplayViewModel } from './viewmodels/VehicleDisplayViewModel';

// ========================================
// Main ViewModel (Primary Interface)
// ========================================
export { VehicleDisplayViewModel } from './viewmodels/VehicleDisplayViewModel';

// ========================================
// UI Components
// ========================================
export { VehicleMarkers } from './views/VehicleMarkers';

// ========================================
// Services
// ========================================
export { SDSMService } from './services/SDSMService';
export { SDSMFrequencyMonitor } from './services/SDSMFrequencyMonitor';

// ========================================
// Models and Types
// ========================================
export type { 
  SDSMObject, 
  SDSMResponse, 
  VehicleInfo, 
  PedestrianInfo 
} from './models/SDSMData';

// ========================================
// Configuration
// ========================================
export const SDSM_CONFIG = {
  FEATURE_NAME: 'SDSM Vehicle Display',
  VERSION: '1.0.0',
  UPDATE_FREQUENCY_HZ: 0.66,
  API_ENDPOINT: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events',
  REQUEST_TIMEOUT_MS: 1000,
  DESCRIPTION: 'Real-time vehicle display from SDSM data at 10Hz'
};

// ========================================
// Quick Setup Function
// ========================================

/**
 * Quick setup function to initialize SDSM vehicle display
 * @returns Configured VehicleDisplayViewModel ready to use
 */
export const createVehicleDisplay = (): VehicleDisplayViewModel => {
  // Removed initialization logs to reduce noise
  
  const viewModel = new VehicleDisplayViewModel();
  return viewModel;
};

/**
 * Test SDSM connection and log results
 */
export const testSDSMConnection = async (): Promise<boolean> => {
  // Removed connection test logs to reduce noise
  
  try {
    const isConnected = await SDSMService.testConnection();
    
    // Removed connection result logs to reduce noise
    
    return isConnected;
  } catch (error) {
    // Removed connection error logs to reduce noise
    return false;
  }
};

/**
 * Usage Guide:
 * 
 * Basic usage in MainViewModel:
 * ```typescript
 * import { VehicleDisplayViewModel } from '@/src/features/SDSM';
 * 
 * // In constructor:
 * this.vehicleDisplayViewModel = new VehicleDisplayViewModel();
 * this.vehicleDisplayViewModel.start(); // Starts 10Hz updates
 * 
 * // In cleanup:
 * this.vehicleDisplayViewModel.cleanup();
 * ```
 * 
 * Usage in MapView component:
 * ```typescript
 * import { VehicleMarkers, VehicleStatusDisplay } from '@/src/features/SDSM';
 * 
 * // In render:
 * <VehicleMarkers viewModel={mainViewModel.vehicleDisplayViewModel} />
 * <VehicleStatusDisplay viewModel={mainViewModel.vehicleDisplayViewModel} />
 * ```
 */