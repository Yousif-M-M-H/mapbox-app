// app/src/features/SpatService/services/TimingCalculationService.ts
// Handles timing calculations and predictions

import { SpatData, SignalState, PhaseTimingInfo } from '../models/SpatModels';
import { DataMappingService } from './DataMappingService';

export class TimingCalculationService {
  
  /**
   * Get timing information for signal groups
   */
  public static getTimingInfoForSignalGroups(
    signalGroups: number[], 
    spatData: SpatData
  ): PhaseTimingInfo[] {
    const timingInfo: PhaseTimingInfo[] = [];
    
    for (const phaseId of signalGroups) {
      if (phaseId >= 1 && phaseId <= 16) {
        const timing = DataMappingService.getPhaseTimingInfo(spatData, phaseId);
        if (timing) {
          timingInfo.push(timing);
        }
      }
    }
    
    return timingInfo;
  }
  
  /**
   * Calculate estimated time to change for a signal state
   */
  public static calculateTimeToChange(
    signalGroups: number[], 
    currentState: SignalState,
    spatData: SpatData
  ): number {
    if (signalGroups.length === 0 || currentState === SignalState.UNKNOWN) {
      return 0;
    }
    
    let minTimeToChange = Number.MAX_SAFE_INTEGER;
    let maxTimeToChange = 0;
    
    for (const phaseId of signalGroups) {
      const timing = DataMappingService.getPhaseTimingInfo(spatData, phaseId);
      if (timing) {
        // Use vehicle timing for now (could be enhanced to consider pedestrian timing)
        if (timing.vehMaxTimeToChange > 0) {
          minTimeToChange = Math.min(minTimeToChange, timing.vehMinTimeToChange);
          maxTimeToChange = Math.max(maxTimeToChange, timing.vehMaxTimeToChange);
        }
      }
    }
    
    // Return max time if available, otherwise 0
    return maxTimeToChange > 0 ? maxTimeToChange : 0;
  }
  
  /**
   * Calculate estimated time to change for approach
   */
  public static calculateApproachTimeToChange(
    laneStatuses: any[],
    spatData: SpatData
  ): number {
    if (laneStatuses.length === 0) return 0;
    
    let maxTimeToChange = 0;
    
    for (const laneStatus of laneStatuses) {
      const timeToChange = this.calculateTimeToChange(
        laneStatus.signalGroups,
        laneStatus.signalState,
        spatData
      );
      maxTimeToChange = Math.max(maxTimeToChange, timeToChange);
    }
    
    return maxTimeToChange;
  }
}