// app/src/features/SpatService/services/SignalStateService.ts
// Handles signal state logic and determination

import { SpatData, SignalState, LaneSignalStatus } from '../models/SpatModels';

export class SignalStateService {
  
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
   * Check if signal data is valid and recent
   */
  public static isSignalDataValid(spatData: SpatData): boolean {
    // Check if timestamp is recent (within last 10 seconds)
    const now = Date.now();
    const dataAge = now - spatData.timestamp;
    const maxAge = 10 * 1000; // 10 seconds
    
    if (dataAge > maxAge) {
      return false;
    }
    
    // Check if we have basic signal state data
    const hasSignalData = 
      spatData.phaseStatusGroupGreens.length > 0 ||
      spatData.phaseStatusGroupYellows.length > 0 ||
      spatData.phaseStatusGroupReds.length > 0;
    
    if (!hasSignalData) {
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
}