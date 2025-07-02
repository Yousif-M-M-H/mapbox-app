// app/src/features/SpatService/viewModels/SpatUIStateManager.ts
// Handles computed properties and UI state

import { makeAutoObservable } from 'mobx';
import { SpatDataManager } from './SpatDataManager';
import { SpatMonitoringManager } from './SpatMonitoringManager';
import { ApproachSignalStatus, SignalState, LaneSignalStatus } from '../models/SpatModels';

export class SpatUIStateManager {
  // Current approach status
  currentApproachStatus: ApproachSignalStatus | null = null;
  
  // Dependencies
  private dataManager: SpatDataManager;
  private monitoringManager: SpatMonitoringManager;
  
  constructor(
    dataManager: SpatDataManager,
    monitoringManager: SpatMonitoringManager
  ) {
    makeAutoObservable(this);
    this.dataManager = dataManager;
    this.monitoringManager = monitoringManager;
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Update current approach status
   */
  setApproachStatus(status: ApproachSignalStatus | null): void {
    this.currentApproachStatus = status;
  }
  
  /**
   * Clear approach status
   */
  clearApproachStatus(): void {
    this.currentApproachStatus = null;
  }
  
  // ========================================
  // Computed Properties for UI
  // ========================================
  
  /**
   * Whether we have valid signal data
   */
  get hasSignalData(): boolean {
    return this.currentApproachStatus !== null && this.dataManager.isDataValid();
  }
  
  /**
   * Current approach signal state
   */
  get approachSignalState(): SignalState {
    return this.currentApproachStatus?.overallSignalState || SignalState.UNKNOWN;
  }
  
  /**
   * Signal status text for display
   */
  get signalStatusText(): string {
    switch (this.approachSignalState) {
      case SignalState.GREEN: return 'GO';
      case SignalState.YELLOW: return 'CAUTION';
      case SignalState.RED: return 'STOP';
      default: return 'NO SIGNAL';
    }
  }
  
  /**
   * Signal color class for styling
   */
  get signalColorClass(): string {
    switch (this.approachSignalState) {
      case SignalState.GREEN: return 'text-green-500';
      case SignalState.YELLOW: return 'text-yellow-500';
      case SignalState.RED: return 'text-red-500';
      default: return 'text-gray-400';
    }
  }
  
  /**
   * Lane signal statuses for detailed view
   */
  get laneSignalStatuses(): LaneSignalStatus[] {
    return this.currentApproachStatus?.laneSignalStatuses || [];
  }
  
  /**
   * Current approach name
   */
  get currentApproachName(): string {
    return this.monitoringManager.approachName;
  }
  
  /**
   * Whether monitoring is active
   */
  get isMonitoring(): boolean {
    return this.monitoringManager.isMonitoring;
  }
  
  /**
   * Last update time
   */
  get lastUpdateTime(): number {
    return this.dataManager.lastUpdateTime;
  }
  
  /**
   * Time since last update
   */
  get timeSinceLastUpdate(): number {
    const lastUpdate = this.dataManager.lastUpdateTime;
    return lastUpdate > 0 ? Date.now() - lastUpdate : -1;
  }
  
  /**
   * Whether there's a loading state
   */
  get loading(): boolean {
    return this.dataManager.loading;
  }
  
  /**
   * Current error message
   */
  get error(): string | null {
    return this.dataManager.error;
  }
  
  /**
   * Estimated time to signal change
   */
  get estimatedTimeToChange(): number {
    return this.currentApproachStatus?.estimatedTimeToChange || 0;
  }
  
  /**
   * Signal data age for debugging
   */
  get dataAge(): number {
    return this.dataManager.getDataAge();
  }
  
  /**
   * Whether signal data is stale
   */
  get isDataStale(): boolean {
    const age = this.dataAge;
    return age > 5000; // Consider stale after 5 seconds
  }
  
  // ========================================
  // Utility Methods
  // ========================================
  
  /**
   * Get formatted time since last update
   */
  getFormattedTimeSinceUpdate(): string {
    const time = this.timeSinceLastUpdate;
    if (time < 0) return 'Never';
    
    const seconds = Math.floor(time / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
  
  /**
   * Get status summary for debugging
   */
  getStatusSummary(): string {
    if (!this.hasSignalData) return 'No signal data';
    
    const state = this.signalStatusText;
    const approach = this.currentApproachName;
    const age = this.getFormattedTimeSinceUpdate();
    
    return `${approach}: ${state} (${age})`;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearApproachStatus();
  }
}