// app/src/features/SpatService/services/SpatBusinessService.ts

import { SpatData, SignalState, LaneSignalStatus, ApproachSignalStatus, PhaseTimingInfo } from '../models/SpatModels';
import { SpatDataService } from './SpatDataService';

export class SpatBusinessService {
  
  /**
   * Determine signal state for a lane based on its signal groups
   */
  public static determineSignalState(signalGroups: number[], spatData: SpatData): SignalState {
    if (signalGroups.length === 0) return SignalState.UNKNOWN;
    
    // Check if any signal group is green (highest priority)
    const hasGreen = signalGroups.some(group => 
      spatData.phaseStatusGroupGreens.includes(group)
    );
    if (hasGreen) return SignalState.GREEN;
    
    // Check if any signal group is yellow (second priority)
    const hasYellow = signalGroups.some(group => 
      spatData.phaseStatusGroupYellows.includes(group)
    );
    if (hasYellow) return SignalState.YELLOW;
    
    // Check if any signal group is red (third priority)
    const hasRed = signalGroups.some(group => 
      spatData.phaseStatusGroupReds.includes(group)
    );
    if (hasRed) return SignalState.RED;
    
    return SignalState.UNKNOWN;
  }
  
  /**
   * Extract signal groups from lane's connectsTo data
   */
  public static extractSignalGroups(laneData: any): number[] {
    if (!laneData.connectsTo || laneData.connectsTo.length === 0) {
      return [];
    }
    
    const signalGroups: number[] = laneData.connectsTo
      .map((connection: any) => connection.signalGroup)
      .filter((group: any) => typeof group === 'number' && group > 0) as number[];
    
    // Remove duplicates
    return [...new Set(signalGroups)];
  }
  
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
        const timing = SpatDataService.getPhaseTimingInfo(spatData, phaseId);
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
      const timing = SpatDataService.getPhaseTimingInfo(spatData, phaseId);
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
   * Get signal status for specific lanes with enhanced timing info
   */
  public static getLaneSignalStatuses(
    lanesData: any[], 
    laneIds: number[], 
    spatData: SpatData
  ): LaneSignalStatus[] {
    const targetLanes = lanesData.filter(lane => laneIds.includes(lane.laneId));
    
    return targetLanes.map(lane => {
      const signalGroups = this.extractSignalGroups(lane);
      const signalState = this.determineSignalState(signalGroups, spatData);
      const timingInfo = this.getTimingInfoForSignalGroups(signalGroups, spatData);
      
      return {
        laneId: lane.laneId,
        signalGroups,
        signalState,
        timingInfo
      };
    });
  }
  
  /**
   * Determine overall signal state for an approach
   */
  public static determineApproachSignalState(laneStatuses: LaneSignalStatus[]): SignalState {
    if (laneStatuses.length === 0) return SignalState.UNKNOWN;
    
    // If any lane is green, approach is green (drivers can proceed)
    if (laneStatuses.some(lane => lane.signalState === SignalState.GREEN)) {
      return SignalState.GREEN;
    }
    
    // If any lane is yellow, approach is yellow (caution)
    if (laneStatuses.some(lane => lane.signalState === SignalState.YELLOW)) {
      return SignalState.YELLOW;
    }
    
    // If all lanes are red, approach is red
    if (laneStatuses.every(lane => lane.signalState === SignalState.RED)) {
      return SignalState.RED;
    }
    
    return SignalState.UNKNOWN;
  }
  
  /**
   * Calculate estimated time to change for approach
   */
  public static calculateApproachTimeToChange(
    laneStatuses: LaneSignalStatus[],
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
  
  /**
   * Create approach signal status with enhanced timing
   */
  public static createApproachSignalStatus(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[],
    spatData: SpatData
  ): ApproachSignalStatus {
    const laneSignalStatuses = this.getLaneSignalStatuses(lanesData, laneIds, spatData);
    const overallSignalState = this.determineApproachSignalState(laneSignalStatuses);
    const estimatedTimeToChange = this.calculateApproachTimeToChange(laneSignalStatuses, spatData);
    
    return {
      approachId,
      approachName,
      laneIds,
      overallSignalState,
      laneSignalStatuses,
      timestamp: spatData.timestamp,
      estimatedTimeToChange
    };
  }
  
  /**
   * Check if signal data is valid and recent
   */
  public static isSignalDataValid(spatData: SpatData): boolean {
    // Check if timestamp is recent (within last 10 seconds)
    const now = Date.now();
    const dataAge = now - spatData.timestamp;
    const maxAge = 10 * 1000; // 10 seconds
    
    if (dataAge > maxAge) {
      console.warn(`⚠️ SPaT data is stale: ${dataAge}ms old`);
      return false;
    }
    
    // Check if we have basic signal state data
    const hasSignalData = 
      spatData.phaseStatusGroupGreens.length > 0 ||
      spatData.phaseStatusGroupYellows.length > 0 ||
      spatData.phaseStatusGroupReds.length > 0;
    
    if (!hasSignalData) {
      console.warn('⚠️ SPaT data has no signal states');
      return false;
    }
    
    return true;
  }
  
  /**
   * Get human-readable signal status summary
   */
  public static getSignalSummary(spatData: SpatData): string {
    const greenPhases = spatData.phaseStatusGroupGreens;
    const yellowPhases = spatData.phaseStatusGroupYellows;
    const redPhases = spatData.phaseStatusGroupReds;
    
    const parts: string[] = [];
    
    if (greenPhases.length > 0) {
      parts.push(`Green: ${greenPhases.join(', ')}`);
    }
    if (yellowPhases.length > 0) {
      parts.push(`Yellow: ${yellowPhases.join(', ')}`);
    }
    if (redPhases.length > 0) {
      parts.push(`Red: ${redPhases.join(', ')}`);
    }
    
    return parts.join(' | ') || 'No active signals';
  }
  
  /**
   * Debug method to log detailed signal information
   */
  public static debugSignalInfo(
    approachName: string,
    laneIds: number[],
    lanesData: any[],
    spatData: SpatData
  ): void {
    console.log(`🚦 === SPaT Debug: ${approachName} ===`);
    console.log(`🚦 Lanes: ${laneIds.join(', ')}`);
    console.log(`🚦 Intersection: ${spatData.intersection}`);
    console.log(`🚦 Timestamp: ${spatData.timestamp} (${new Date(spatData.timestamp).toLocaleTimeString()})`);
    console.log(`🚦 Signal Summary: ${this.getSignalSummary(spatData)}`);
    
    const laneStatuses = this.getLaneSignalStatuses(lanesData, laneIds, spatData);
    laneStatuses.forEach(status => {
      console.log(`🚦 Lane ${status.laneId}: ${status.signalState} (Groups: ${status.signalGroups.join(', ')})`);
      if (status.timingInfo && status.timingInfo.length > 0) {
        status.timingInfo.forEach(timing => {
          if (timing.vehMaxTimeToChange > 0) {
            console.log(`    ⏱️ Phase ${timing.phaseId}: ${timing.vehMinTimeToChange}-${timing.vehMaxTimeToChange}s to change`);
          }
        });
      }
    });
    
    const approachStatus = this.createApproachSignalStatus('debug', approachName, laneIds, lanesData, spatData);
    console.log(`🚦 Overall: ${approachStatus.overallSignalState} (Est. ${approachStatus.estimatedTimeToChange}s to change)`);
  }
}