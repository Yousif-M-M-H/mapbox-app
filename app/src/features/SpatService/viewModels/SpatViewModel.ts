// app/src/features/SpatService/viewModels/SpatViewModel.ts
// Clean main ViewModel that coordinates managers and provides public API

import { makeAutoObservable } from 'mobx';
import { SpatDataManager } from './SpatDataManager';
import { SpatMonitoringManager } from './SpatMonitoringManager';
import { SpatSignalManager } from './SpatSignalManager';
import { SpatUIStateManager } from './SpatUIStateManager';
import { SpatErrorHandler } from '../errorHandling/SpatErrorHandler';
import { SignalState, LaneSignalStatus } from '../models/SpatModels';

export class SpatViewModel {
  // Managers - single responsibility each
  private dataManager: SpatDataManager;
  private monitoringManager: SpatMonitoringManager;
  private signalManager: SpatSignalManager;
  private uiStateManager: SpatUIStateManager;
  
  constructor() {
    makeAutoObservable(this);
    
    // Initialize managers
    this.dataManager = new SpatDataManager();
    this.monitoringManager = new SpatMonitoringManager(this.dataManager);
    this.signalManager = new SpatSignalManager();
    this.uiStateManager = new SpatUIStateManager(this.dataManager, this.monitoringManager);
    
    // Setup automatic signal status updates when data changes
    this.monitoringManager.setDataUpdateCallback(() => {
      this.updateSignalStatus();
    });
  }
  
  // ========================================
  // Public API - Data Operations
  // ========================================
  
  /**
   * Fetch current SPaT data without monitoring
   */
  async fetchCurrentSpatData(): Promise<void> {
    await this.dataManager.fetchCurrentData();
  }
  
  /**
   * Force refresh current data
   */
  async refreshSignalData(): Promise<void> {
    await this.monitoringManager.refreshData();
  }
  
  // ========================================
  // Public API - Monitoring Operations
  // ========================================
  
  /**
   * Start monitoring signal status for an approach
   */
  async startMonitoringApproach(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): Promise<void> {
    try {
      // Start monitoring
      await this.monitoringManager.startMonitoring(approachId, approachName, laneIds, lanesData);
      
      // Build initial signal status
      await this.updateSignalStatus();
      
    } catch (error) {
      SpatErrorHandler.logError('startMonitoringApproach', error);
      throw error;
    }
  }
  
  /**
   * Stop monitoring signal status
   */
  stopMonitoring(): void {
    this.monitoringManager.stopMonitoring();
    this.uiStateManager.clearApproachStatus();
  }
  
  // ========================================
  // Public API - Lane Signal Operations
  // ========================================
  
  /**
   * Get signal status for specific lanes (one-time check)
   */
  async getSignalStatusForLanes(
    laneIds: number[],
    lanesData: any[]
  ): Promise<LaneSignalStatus[]> {
    try {
      await this.dataManager.fetchCurrentData();
      
      if (!this.dataManager.currentSpatData) {
        return [];
      }
      
      return this.signalManager.getSignalStatusForLanes(
        laneIds,
        lanesData,
        this.dataManager.currentSpatData
      );
      
    } catch (error) {
      SpatErrorHandler.logError('getSignalStatusForLanes', error);
      return [];
    }
  }
  
  // ========================================
  // Public API - UI State (Delegated to UIStateManager)
  // ========================================
  
  get hasSignalData(): boolean {
    return this.uiStateManager.hasSignalData;
  }
  
  get approachSignalState(): SignalState {
    return this.uiStateManager.approachSignalState;
  }
  
  get signalStatusText(): string {
    return this.uiStateManager.signalStatusText;
  }
  
  get signalColorClass(): string {
    return this.uiStateManager.signalColorClass;
  }
  
  get laneSignalStatuses(): LaneSignalStatus[] {
    return this.uiStateManager.laneSignalStatuses;
  }
  
  get currentApproachName(): string {
    return this.uiStateManager.currentApproachName;
  }
  
  get isMonitoring(): boolean {
    return this.uiStateManager.isMonitoring;
  }
  
  get lastUpdateTime(): number {
    return this.uiStateManager.lastUpdateTime;
  }
  
  get timeSinceLastUpdate(): number {
    return this.uiStateManager.timeSinceLastUpdate;
  }
  
  get loading(): boolean {
    return this.uiStateManager.loading;
  }
  
  get error(): string | null {
    return this.uiStateManager.error;
  }
  
  // ========================================
  // Public API - Direct Access to Managers (if needed)
  // ========================================
  
  get currentSpatData() {
    return this.dataManager.currentSpatData;
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Update signal status based on current monitoring state
   */
  private async updateSignalStatus(): Promise<void> {
    if (!this.monitoringManager.isMonitoring || !this.dataManager.currentSpatData) {
      return;
    }
    
    try {
      const approachStatus = this.signalManager.buildApproachSignalStatus(
        this.monitoringManager.currentApproachId,
        this.monitoringManager.currentApproachName,
        this.monitoringManager.currentLaneIds,
        this.monitoringManager.currentLanesData,
        this.dataManager.currentSpatData
      );
      
      this.uiStateManager.setApproachStatus(approachStatus);
      
    } catch (error) {
      SpatErrorHandler.logError('updateSignalStatus', error);
    }
  }
  
  // ========================================
  // Cleanup
  // ========================================
  
  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.monitoringManager.cleanup();
    this.dataManager.cleanup();
    this.uiStateManager.cleanup();
  }
}