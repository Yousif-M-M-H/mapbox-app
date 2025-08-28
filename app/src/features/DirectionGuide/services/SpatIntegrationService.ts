// app/src/features/DirectionGuide/services/SpatIntegrationService.ts

import { SpatIntegration } from '../../SpatService/SpatIntegration';
import { SignalState } from '../../SpatService/models/SpatModels';

/**
 * Service to handle SPaT integration for DirectionGuide
 * Separates SPaT logic from ViewModels
 */
export class SpatIntegrationService {
  private spatViewModel = SpatIntegration.getSpatViewModel();
  private updateInterval: NodeJS.Timeout | null = null;
  
  /**
   * Start continuous SPaT monitoring for given signal groups
   */
  async startMonitoring(signalGroups: number[]): Promise<void> {
    if (signalGroups.length === 0) {
      return;
    }
    
    // Stop any existing monitoring
    this.stopMonitoring();
    
    try {
      // Initial load
      await this.spatViewModel.fetchCurrentSpatData();
      
      // Start continuous updates every 500ms
      this.updateInterval = setInterval(async () => {
        try {
          await this.spatViewModel.fetchCurrentSpatData();
        } catch (error) {
        }
      }, 500);
      
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Stop SPaT monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Get current signal state for signal groups
   */
  getCurrentSignalState(signalGroups: number[]): SignalState {
    if (!this.spatViewModel.currentSpatData || signalGroups.length === 0) {
      return SignalState.UNKNOWN;
    }
    
    const spatData = this.spatViewModel.currentSpatData;
    
    // Check each signal group and get the most restrictive state
    const signalStates: SignalState[] = [];
    
    for (const signalGroup of signalGroups) {
      const groupSignalState = this.determineSignalStateForGroup(signalGroup, spatData);
      signalStates.push(groupSignalState);
    }
    
    // Return most restrictive state: Red > Yellow > Green > Unknown
    if (signalStates.includes(SignalState.RED)) {
      return SignalState.RED;
    } else if (signalStates.includes(SignalState.YELLOW)) {
      return SignalState.YELLOW;
    } else if (signalStates.includes(SignalState.GREEN)) {
      return SignalState.GREEN;
    } else {
      return SignalState.UNKNOWN;
    }
  }
  
  /**
   * Check if SPaT data is fresh and valid
   */
  isSpatDataValid(): boolean {
    if (!this.spatViewModel.currentSpatData) {
      return false;
    }
    
    const dataAge = Date.now() - this.spatViewModel.currentSpatData.timestamp;
    const maxAge = 3000; // 3 seconds
    
    return dataAge <= maxAge;
  }
  
  /**
   * Get age of SPaT data in milliseconds
   */
  getSpatDataAge(): number {
    if (!this.spatViewModel.currentSpatData) {
      return -1;
    }
    
    return Date.now() - this.spatViewModel.currentSpatData.timestamp;
  }
  
  /**
   * Get monitoring status
   */
  isMonitoring(): boolean {
    return this.updateInterval !== null;
  }
  
  /**
   * Private method to determine signal state for a specific signal group
   */
  private determineSignalStateForGroup(signalGroup: number, spatData: any): SignalState {
    // Check in priority order: Green > Yellow > Red > Unknown
    if (spatData.phaseStatusGroupGreens && Array.isArray(spatData.phaseStatusGroupGreens) && 
        spatData.phaseStatusGroupGreens.includes(signalGroup)) {
      return SignalState.GREEN;
    }
    
    if (spatData.phaseStatusGroupYellows && Array.isArray(spatData.phaseStatusGroupYellows) && 
        spatData.phaseStatusGroupYellows.includes(signalGroup)) {
      return SignalState.YELLOW;
    }
    
    if (spatData.phaseStatusGroupReds && Array.isArray(spatData.phaseStatusGroupReds) && 
        spatData.phaseStatusGroupReds.includes(signalGroup)) {
      return SignalState.RED;
    }
    
    return SignalState.UNKNOWN;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
  }
}