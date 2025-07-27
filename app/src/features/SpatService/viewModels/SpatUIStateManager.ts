// app/src/features/SpatService/viewModels/SpatUIStateManager.ts
// Enhanced with countdown using existing API fields only

import { makeAutoObservable } from 'mobx';
import { SpatDataManager } from './SpatDataManager';
import { SpatMonitoringManager } from './SpatMonitoringManager';
import { ApproachSignalStatus, SignalState, LaneSignalStatus } from '../models/SpatModels';
import { CountdownTimingService, CountdownResult } from '../services/CountdownTimingService';

export class SpatUIStateManager {
  currentApproachStatus: ApproachSignalStatus | null = null;
  
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
  
  setApproachStatus(status: ApproachSignalStatus | null): void {
    this.currentApproachStatus = status;
  }
  
  clearApproachStatus(): void {
    this.currentApproachStatus = null;
  }
  
  // Existing computed properties
  get hasSignalData(): boolean {
    return this.currentApproachStatus !== null && this.dataManager.isDataValid();
  }
  
  get approachSignalState(): SignalState {
    return this.currentApproachStatus?.overallSignalState || SignalState.UNKNOWN;
  }
  
  get signalStatusText(): string {
    switch (this.approachSignalState) {
      case SignalState.GREEN: return 'GO';
      case SignalState.YELLOW: return 'CAUTION';
      case SignalState.RED: return 'STOP';
      default: return 'NO SIGNAL';
    }
  }
  
  get signalColorClass(): string {
    switch (this.approachSignalState) {
      case SignalState.GREEN: return 'text-green-500';
      case SignalState.YELLOW: return 'text-yellow-500';
      case SignalState.RED: return 'text-red-500';
      default: return 'text-gray-400';
    }
  }
  
  get laneSignalStatuses(): LaneSignalStatus[] {
    return this.currentApproachStatus?.laneSignalStatuses || [];
  }
  
  // NEW: Countdown timing computed properties
  get signalCountdown(): CountdownResult {
    if (!this.hasSignalData || !this.dataManager.currentSpatData) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    // Get signal groups from the first lane (simplified approach)
    const firstLane = this.laneSignalStatuses[0];
    if (!firstLane) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    return CountdownTimingService.getCountdownForSignalGroups(
      firstLane.signalGroups,
      this.approachSignalState,
      this.dataManager.currentSpatData
    );
  }
  
  get hasCountdown(): boolean {
    return this.signalCountdown.hasCountdown;
  }
  
  get countdownSeconds(): number {
    return this.signalCountdown.remainingSeconds;
  }
  
  get formattedCountdown(): string {
    return this.signalCountdown.formattedTime;
  }
  
  // Enhanced signal status with countdown
  get signalStatusWithCountdown(): string {
    const baseStatus = this.signalStatusText;
    if (this.hasCountdown && this.formattedCountdown) {
      return `${baseStatus} (${this.formattedCountdown})`;
    }
    return baseStatus;
  }
  
  // Existing properties remain unchanged
  get currentApproachName(): string {
    return this.monitoringManager.approachName;
  }
  
  get isMonitoring(): boolean {
    return this.monitoringManager.isMonitoring;
  }
  
  get lastUpdateTime(): number {
    return this.dataManager.lastUpdateTime;
  }
  
  get timeSinceLastUpdate(): number {
    const lastUpdate = this.dataManager.lastUpdateTime;
    return lastUpdate > 0 ? Date.now() - lastUpdate : -1;
  }
  
  get loading(): boolean {
    return this.dataManager.loading;
  }
  
  get error(): string | null {
    return this.dataManager.error;
  }
  
  get estimatedTimeToChange(): number {
    return this.currentApproachStatus?.estimatedTimeToChange || 0;
  }
  
  get dataAge(): number {
    return this.dataManager.getDataAge();
  }
  
  get isDataStale(): boolean {
    const age = this.dataAge;
    return age > 5000;
  }
  
  // Utility methods
  getFormattedTimeSinceUpdate(): string {
    const time = this.timeSinceLastUpdate;
    if (time < 0) return 'Never';
    
    const seconds = Math.floor(time / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
  
  getStatusSummary(): string {
    if (!this.hasSignalData) return 'No signal data';
    
    const state = this.signalStatusWithCountdown;
    const approach = this.currentApproachName;
    const age = this.getFormattedTimeSinceUpdate();
    
    return `${approach}: ${state} (${age})`;
  }
  
  cleanup(): void {
    this.clearApproachStatus();
  }
}