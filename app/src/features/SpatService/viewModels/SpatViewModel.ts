// app/src/features/SpatService/viewModels/SpatViewModel.ts
// Clean ViewModel focused on state management and coordination

import { makeAutoObservable, runInAction } from 'mobx';
import { SpatApiService } from '../services/SpatApiService';
import { DataMappingService } from '../services/DataMappingService';
import { SignalStateService } from '../services/SignalStateService';
import { TimingCalculationService } from '../services/TimingCalculationService';
import { SpatErrorHandler } from '../errorHandling/SpatErrorHandler';
import { SpatData, SignalState, ApproachSignalStatus, LaneSignalStatus } from '../models/SpatModels';

export class SpatViewModel {
  // Core state
  loading: boolean = false;
  error: string | null = null;
  currentSpatData: SpatData | null = null;
  
  // Approach-specific data
  currentApproachSignalStatus: ApproachSignalStatus | null = null;
  
  // Monitoring state
  private _updateInterval: NodeJS.Timeout | null = null;
  private _lastUpdateTime: number = 0;
  private _isActive: boolean = false;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // ========================================
  // Public API - Data Fetching
  // ========================================
  
  /**
   * Fetch current SPaT data without starting monitoring
   */
  public async fetchCurrentSpatData(): Promise<void> {
    try {
      const rawData = await SpatApiService.fetchSpatData();
      const spatData = DataMappingService.mapApiResponseToSpatData(rawData);
      
      runInAction(() => {
        this.currentSpatData = spatData;
        this._lastUpdateTime = Date.now();
        this.error = null;
      });
    } catch (error) {
      const errorMessage = SpatErrorHandler.getErrorMessage(error);
      SpatErrorHandler.logError('fetchCurrentSpatData', error);
      
      runInAction(() => {
        this.error = errorMessage;
      });
      throw error;
    }
  }
  
  // ========================================
  // Public API - Monitoring
  // ========================================
  
  /**
   * Start monitoring signal status for an approach
   */
  public async startMonitoringApproach(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): Promise<void> {
    try {
      this.stopMonitoring();
      
      runInAction(() => {
        this.loading = true;
        this.error = null;
        this._isActive = true;
      });
      
      // Initial load
      await this.loadSignalStatusForApproach(approachId, approachName, laneIds, lanesData);
      
      // Start periodic updates
      this.startPeriodicUpdates(approachId, approachName, laneIds, lanesData);
      
      runInAction(() => {
        this.loading = false;
      });
      
    } catch (error) {
      const errorMessage = SpatErrorHandler.getErrorMessage(error);
      SpatErrorHandler.logError('startMonitoringApproach', error);
      
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
        this._isActive = false;
      });
      throw error;
    }
  }
  
  /**
   * Stop monitoring signal status
   */
  public stopMonitoring(): void {
    if (this._updateInterval) {
      clearInterval(this._updateInterval);
      this._updateInterval = null;
    }
    
    runInAction(() => {
      this._isActive = false;
      this.currentApproachSignalStatus = null;
    });
  }
  
  // ========================================
  // Public API - Lane Signal Status
  // ========================================
  
  /**
   * Get signal status for specific lanes (one-time check)
   */
  public async getSignalStatusForLanes(
    laneIds: number[],
    lanesData: any[]
  ): Promise<LaneSignalStatus[]> {
    try {
      const rawData = await SpatApiService.fetchSpatData();
      const spatData = DataMappingService.mapApiResponseToSpatData(rawData);
      
      return this.buildLaneSignalStatuses(lanesData, laneIds, spatData);
    } catch (error) {
      SpatErrorHandler.logError('getSignalStatusForLanes', error);
      return [];
    }
  }
  
  // ========================================
  // Computed Properties (Getters)
  // ========================================
  
  get hasSignalData(): boolean {
    return this.currentApproachSignalStatus !== null;
  }
  
  get approachSignalState(): SignalState {
    return this.currentApproachSignalStatus?.overallSignalState || SignalState.UNKNOWN;
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
  
  get isMonitoring(): boolean {
    return this._isActive;
  }
  
  get lastUpdateTime(): number {
    return this._lastUpdateTime;
  }
  
  get timeSinceLastUpdate(): number {
    return this._lastUpdateTime > 0 ? Date.now() - this._lastUpdateTime : -1;
  }
  
  get laneSignalStatuses(): LaneSignalStatus[] {
    return this.currentApproachSignalStatus?.laneSignalStatuses || [];
  }
  
  get currentApproachName(): string {
    return this.currentApproachSignalStatus?.approachName || '';
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Load signal status for approach
   */
  private async loadSignalStatusForApproach(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): Promise<void> {
    const rawData = await SpatApiService.fetchSpatData();
    const spatData = DataMappingService.mapApiResponseToSpatData(rawData);
    const approachStatus = this.buildApproachSignalStatus(
      approachId,
      approachName,
      laneIds,
      lanesData,
      spatData
    );
    
    runInAction(() => {
      this.currentSpatData = spatData;
      this.currentApproachSignalStatus = approachStatus;
      this._lastUpdateTime = Date.now();
    });
  }
  
  /**
   * Start periodic updates
   */
  private startPeriodicUpdates(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): void {
    this._updateInterval = setInterval(async () => {
      if (!this._isActive) return;
      
      try {
        await this.loadSignalStatusForApproach(approachId, approachName, laneIds, lanesData);
      } catch (error) {
        SpatErrorHandler.logError('periodicUpdate', error);
      }
    }, 3000); // Update every 3 seconds
  }
  
  /**
   * Build lane signal statuses
   */
  private buildLaneSignalStatuses(
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
   * Build approach signal status
   */
  private buildApproachSignalStatus(
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
  
  // ========================================
  // Utility Methods
  // ========================================
  
  /**
   * Force refresh signal data
   */
  public async refreshSignalData(): Promise<void> {
    await this.fetchCurrentSpatData();
  }
  
  /**
   * Cleanup resources
   */
  public cleanup(): void {
    this.stopMonitoring();
    
    runInAction(() => {
      this.currentSpatData = null;
      this.currentApproachSignalStatus = null;
      this.error = null;
      this._lastUpdateTime = 0;
    });
  }
}