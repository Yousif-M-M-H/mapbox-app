// app/src/features/SpatService/viewModels/SpatSignalManager.ts
// Handles building signal statuses for lanes and approaches

import { makeAutoObservable } from 'mobx';
import { SignalStateService } from '../services/SignalStateService';
import { TimingCalculationService } from '../services/TimingCalculationService';
import { SpatData, LaneSignalStatus, ApproachSignalStatus } from '../models/SpatModels';

export class SpatSignalManager {
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Build lane signal statuses from lanes data and SPaT data
   */
  buildLaneSignalStatuses(
    lanesData: any[], 
    laneIds: number[], 
    spatData: SpatData
  ): LaneSignalStatus[] {
    const targetLanes = lanesData.filter(lane => laneIds.includes(lane.laneId));
    
    return targetLanes.map(lane => {
      const signalGroups = SignalStateService.extractSignalGroups(lane);
      const signalState = SignalStateService.determineSignalState(signalGroups, spatData);
      const timingInfo = TimingCalculationService.getTimingInfoForSignalGroups(signalGroups, spatData);
      
      return {
        laneId: lane.laneId,
        signalGroups,
        signalState,
        timingInfo
      };
    });
  }
  
  /**
   * Build approach signal status from lanes data and SPaT data
   */
  buildApproachSignalStatus(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[],
    spatData: SpatData
  ): ApproachSignalStatus {
    const laneSignalStatuses = this.buildLaneSignalStatuses(lanesData, laneIds, spatData);
    const overallSignalState = SignalStateService.determineApproachSignalState(laneSignalStatuses);
    const estimatedTimeToChange = TimingCalculationService.calculateApproachTimeToChange(laneSignalStatuses, spatData);
    
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
   * Get signal status for specific lanes (utility method)
   */
  getSignalStatusForLanes(
    laneIds: number[],
    lanesData: any[],
    spatData: SpatData
  ): LaneSignalStatus[] {
    return this.buildLaneSignalStatuses(lanesData, laneIds, spatData);
  }
  
  /**
   * Check if signal data meets quality requirements
   */
  validateSignalData(spatData: SpatData): boolean {
    return SignalStateService.isSignalDataValid(spatData);
  }
  
  /**
   * Get human-readable signal summary
   */
  getSignalSummary(spatData: SpatData): string {
    return SignalStateService.getSignalSummary(spatData);
  }
}