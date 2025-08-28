// app/src/features/SpatService/viewModels/SpatMonitoringManager.ts
// Handles monitoring lifecycle and periodic updates

import { makeAutoObservable, runInAction } from 'mobx';
import { SpatDataManager } from './SpatDataManager';
import { SpatErrorHandler } from '../errorHandling/SpatErrorHandler';

export class SpatMonitoringManager {
  // State
  isActive: boolean = false;
  currentApproachId: string = '';
  currentApproachName: string = '';
  currentLaneIds: number[] = [];
  currentLanesData: any[] = [];
  
  // Dependencies
  private dataManager: SpatDataManager;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY = 3000; // 3 seconds
  
  // Callback for when data updates
  private onDataUpdateCallback: (() => void) | null = null;
  
  constructor(dataManager: SpatDataManager) {
    makeAutoObservable(this);
    this.dataManager = dataManager;
  }
  
  /**
   * Set callback to be called when data updates
   */
  setDataUpdateCallback(callback: () => void): void {
    this.onDataUpdateCallback = callback;
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Start monitoring for an approach
   */
  async startMonitoring(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): Promise<void> {
    try {
      // Stop any existing monitoring
      this.stopMonitoring();
      
      runInAction(() => {
        this.isActive = true;
        this.currentApproachId = approachId;
        this.currentApproachName = approachName;
        this.currentLaneIds = [...laneIds];
        this.currentLanesData = [...lanesData];
      });
      
      // Initial data fetch
      await this.dataManager.fetchCurrentData();
      
      // Trigger callback after initial fetch
      this.triggerDataUpdateCallback();
      
      // Start periodic updates
      this.startPeriodicUpdates();
      
      
    } catch (error) {
      SpatErrorHandler.logError('startMonitoring', error);
      this.stopMonitoring();
      throw error;
    }
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    runInAction(() => {
      this.isActive = false;
      this.currentApproachId = '';
      this.currentApproachName = '';
      this.currentLaneIds = [];
      this.currentLanesData = [];
    });
    
  }
  
  /**
   * Force refresh current data
   */
  async refreshData(): Promise<void> {
    if (!this.isActive) return;
    
    try {
      await this.dataManager.fetchCurrentData();
      this.triggerDataUpdateCallback();
    } catch (error) {
      SpatErrorHandler.logError('refreshData', error);
      // Don't stop monitoring on refresh errors
    }
  }
  
  // ========================================
  // Getters
  // ========================================
  
  get isMonitoring(): boolean {
    return this.isActive;
  }
  
  get approachName(): string {
    return this.currentApproachName;
  }
  
  get laneIds(): number[] {
    return this.currentLaneIds;
  }
  
  get lanesData(): any[] {
    return this.currentLanesData;
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Start periodic data updates
   */
  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      try {
        await this.dataManager.fetchCurrentData();
        this.triggerDataUpdateCallback();
      } catch (error) {
        SpatErrorHandler.logError('periodicUpdate', error);
        // Continue monitoring even if individual updates fail
      }
    }, this.UPDATE_FREQUENCY);
  }
  
  /**
   * Trigger data update callback if set
   */
  private triggerDataUpdateCallback(): void {
    if (this.onDataUpdateCallback) {
      try {
        this.onDataUpdateCallback();
      } catch (error) {
        SpatErrorHandler.logError('dataUpdateCallback', error);
      }
    }
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
  }
}