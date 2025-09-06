// app/src/features/DirectionGuide/viewModels/PositionChangeHandler.ts

import { LaneDetectionViewModel } from './LaneDetectionViewModel';
import { TurnDataManager } from './TurnDataManager';
import { SpatStateManager } from './SpatStateManager';

/**
 * Handles the workflow when vehicle position changes
 * Single responsibility: Coordinate position change responses
 */
export class PositionChangeHandler {
  constructor(
    private laneDetection: LaneDetectionViewModel,
    private turnDataManager: TurnDataManager,
    private spatStateManager: SpatStateManager
  ) {}
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Handle vehicle position change
   * Returns whether the turn guide should be shown
   */
  async handlePositionChange(position: [number, number]): Promise<boolean> {
    try {
      // Step 1: Update lane detection
      const laneDetectionChanged = this.laneDetection.setVehiclePosition(position);
      
      // Step 2: Check if vehicle entered or left lanes
      const isInAnyLane = this.laneDetection.isInAnyLane;
      const wasInLane = this.spatStateManager.isMonitoring;
      
      if (isInAnyLane && !wasInLane) {
        // Vehicle entered lanes - start monitoring immediately
        await this.handleEnteredLanes();
      } else if (isInAnyLane && laneDetectionChanged) {
        // Still in lanes but detection changed - update monitoring
        await this.updateSpatMonitoringForCurrentLanes();
      } else if (!isInAnyLane && wasInLane) {
        // Vehicle left lanes - clear data
        this.handleLeftLanes();
      }
      
      // Always return current lane state (don't wait for detection change)
      return isInAnyLane;
      
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get current lane information for display
   */
  getLaneInfo(): {
    approachName: string;
    currentLanes: string;
    detectedLaneIds: number[];
  } {
    return {
      approachName: this.laneDetection.currentApproachName,
      currentLanes: this.laneDetection.currentLanes,
      detectedLaneIds: this.laneDetection.detectedLaneIds
    };
  }
  
  /**
   * Check if vehicle is in a specific lane
   */
  isInLane(laneId: number): boolean {
    return this.laneDetection.isInLane(laneId);
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Handle when vehicle enters lanes
   */
  private async handleEnteredLanes(): Promise<void> {
    
    // Load turn data and start SPaT monitoring in parallel
    await Promise.all([
      this.loadTurnDataForCurrentLanes(),
      this.startSpatMonitoringForCurrentLanes()
    ]);
  }
  
  /**
   * Handle when vehicle leaves lanes
   */
  private handleLeftLanes(): void {
    
    // Clear turn data and stop SPaT monitoring
    this.turnDataManager.clearTurnData();
    this.spatStateManager.stopMonitoring();
  }
  
  /**
   * Load turn data for currently detected lanes
   */
  private async loadTurnDataForCurrentLanes(): Promise<void> {
    try {
      const lanesData = this.laneDetection.getLanesForPosition();
      const vehiclePosition = this.laneDetection.vehiclePosition;
      
      await this.turnDataManager.loadTurnData(lanesData, vehiclePosition);
      
    } catch (error) {
    }
  }
  
  /**
   * Start SPaT monitoring for currently detected lanes
   */
  private async startSpatMonitoringForCurrentLanes(): Promise<void> {
    try {
      const signalGroups = this.laneDetection.getSignalGroups();
      
      if (signalGroups.length > 0) {
        await this.spatStateManager.startMonitoring(signalGroups);
      }
      
    } catch (error) {
      // SPaT monitoring failed, but continue
    }
  }
  
  /**
   * Update SPaT monitoring when lane detection changes
   */
  private async updateSpatMonitoringForCurrentLanes(): Promise<void> {
    try {
      // Stop current monitoring and restart with new lane data
      this.spatStateManager.stopMonitoring();
      await this.startSpatMonitoringForCurrentLanes();
      
    } catch (error) {
      // SPaT monitoring update failed, but continue
    }
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    // Individual managers handle their own cleanup
    // This handler doesn't own any resources directly
  }
}