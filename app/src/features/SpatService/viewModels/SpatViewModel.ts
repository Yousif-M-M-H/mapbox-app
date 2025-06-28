// app/src/features/SpatService/viewModels/SpatViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { SpatDataService } from '../services/SpatDataService';
import { SpatBusinessService } from '../services/SpatBusinessService';
import { SpatData, SignalState, ApproachSignalStatus, LaneSignalStatus } from '../models/SpatModels';

export class SpatViewModel {
  // State
  loading: boolean = false;
  error: string | null = null;
  currentSpatData: SpatData | null = null;
  
  // Approach-specific data
  currentApproachSignalStatus: ApproachSignalStatus | null = null;
  
  // Update management
  private _updateInterval: NodeJS.Timeout | null = null;
  private _lastUpdateTime: number = 0;
  private _isActive: boolean = false;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Fetch current SPaT data without starting monitoring
   */
  public async fetchCurrentSpatData(): Promise<void> {
    try {
      const spatData = await SpatDataService.fetchSpatData();
      runInAction(() => {
        this.currentSpatData = spatData;
        this._lastUpdateTime = Date.now();
        this.error = null;
      });
    } catch (error) {
      console.error('Failed to fetch SPaT data:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'SPaT fetch failed';
      });
    }
  }
  
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
      console.error('SPaT monitoring start failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'SPaT start failed';
        this.loading = false;
      });
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
  
  /**
   * Get signal status for specific lanes (one-time check)
   */
  public async getSignalStatusForLanes(
    laneIds: number[],
    lanesData: any[]
  ): Promise<LaneSignalStatus[]> {
    try {
      const spatData = await SpatDataService.fetchSpatData();
      return SpatBusinessService.getLaneSignalStatuses(lanesData, laneIds, spatData);
    } catch (error) {
      console.error('One-time signal check failed:', error);
      return [];
    }
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
    const spatData = await SpatDataService.fetchSpatData();
    const approachStatus = SpatBusinessService.createApproachSignalStatus(
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
        console.error('SPaT periodic update failed:', error);
      }
    }, 3000); // Update every 3 seconds
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