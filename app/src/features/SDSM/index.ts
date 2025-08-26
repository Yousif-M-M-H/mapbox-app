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
  // Log SDSM vehicle display initialization with configuration details
  // Helps verify correct setup and configuration values during startup
  console.log(`🚗 Creating ${SDSM_CONFIG.FEATURE_NAME} v${SDSM_CONFIG.VERSION}`);
  console.log(`🚗 Frequency: ${SDSM_CONFIG.UPDATE_FREQUENCY_HZ}Hz`);
  console.log(`🚗 Endpoint: ${SDSM_CONFIG.API_ENDPOINT}`);
  
  const viewModel = new VehicleDisplayViewModel();
  return viewModel;
};

/**
 * Test SDSM connection and log results
 */
export const testSDSMConnection = async (): Promise<boolean> => {
  // Log SDSM connection test initiation for debugging network connectivity
  console.log('🚗 Testing SDSM connection...');
  
  try {
    const isConnected = await SDSMService.testConnection();
    
    // Log SDSM connection test results to confirm API availability
    // Essential for diagnosing network issues and API endpoint problems
    if (isConnected) {
      console.log('✅ SDSM connection successful');
      console.log(`🚗 Ready to display vehicles at ${SDSM_CONFIG.UPDATE_FREQUENCY_HZ}Hz`);
    } else {
      console.log('❌ SDSM connection failed');
      console.log('🚗 Check API endpoint and network connectivity');
    }
    
    return isConnected;
  } catch (error) {
    // Log SDSM connection errors for troubleshooting network or API issues
    console.error('🚗 SDSM connection test error:', error);
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