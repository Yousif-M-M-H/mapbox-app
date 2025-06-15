// app/src/features/SpatService/services/SpatBusinessService.ts

import { SpatData, SignalState, LaneSignalStatus, ApproachSignalStatus } from '../models/SpatModels';

export class SpatBusinessService {
  
  /**
   * Determine signal state for a lane based on its signal groups
   */
  public static determineSignalState(signalGroups: number[], spatData: SpatData): SignalState {
    if (signalGroups.length === 0) return SignalState.UNKNOWN;
    
    // Check if any signal group is green
    const hasGreen = signalGroups.some(group => 
      spatData.phaseStatusGroupGreens.includes(group)
    );
    if (hasGreen) return SignalState.GREEN;
    
    // Check if any signal group is yellow
    const hasYellow = signalGroups.some(group => 
      spatData.phaseStatusGroupYellows.includes(group)
    );
    if (hasYellow) return SignalState.YELLOW;
    
    // Check if any signal group is red
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
   * Get signal status for specific lanes
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
      
      return {
        laneId: lane.laneId,
        signalGroups,
        signalState
      };
    });
  }
  
  /**
   * Determine overall signal state for an approach
   */
  public static determineApproachSignalState(laneStatuses: LaneSignalStatus[]): SignalState {
    if (laneStatuses.length === 0) return SignalState.UNKNOWN;
    
    // If any lane is green, approach is green
    if (laneStatuses.some(lane => lane.signalState === SignalState.GREEN)) {
      return SignalState.GREEN;
    }
    
    // If any lane is yellow, approach is yellow
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
   * Create approach signal status
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
    
    return {
      approachId,
      approachName,
      laneIds,
      overallSignalState,
      laneSignalStatuses,
      timestamp: spatData.timestamp
    };
  }
}