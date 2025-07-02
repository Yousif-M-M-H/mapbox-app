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
      
      if (!laneDetectionChanged) {
        return this.laneDetection.isInAnyLane; // No change, return current state
      }
      
      // Step 2: Check if vehicle entered or left lanes
      const isInAnyLane = this.laneDetection.isInAnyLane;
      
      if (isInAnyLane) {
        // Vehicle entered lanes - load data
        await this.handleEnteredLanes();
      } else {
        // Vehicle left lanes - clear data
        this.handleLeftLanes();
      }
      
      return isInAnyLane;
      
    } catch (error) {
      console.error('❌ Position change handling failed:', error);
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
    console.log(`🛣️ Vehicle entered lanes: ${this.laneDetection.detectedLaneIds.join(', ')}`);
    
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
    console.log('🛣️ Vehicle left all lanes');
    
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
      console.error('❌ Failed to load turn data for current lanes:', error);
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
      } else {
        console.log('🚦 No signal groups found for current lanes');
      }
      
    } catch (error) {
      console.error('❌ Failed to start SPaT monitoring for current lanes:', error);
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