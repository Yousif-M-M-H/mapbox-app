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
  
  // Update management - 2x per second = 500ms
  private static readonly UPDATE_INTERVAL_MS = 500; // 500ms = 2 updates per second
  private _updateInterval: NodeJS.Timeout | null = null;
  private _lastUpdateTime: number = 0;
  private _isActive: boolean = false;
  private _updateCount: number = 0;
  private _errorCount: number = 0;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // ========================================
  // Public Methods
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
      console.log(`🚦 Starting SPaT monitoring: ${approachName} (${SpatViewModel.UPDATE_INTERVAL_MS}ms intervals)`);
      
      this.stopMonitoring();
      
      runInAction(() => {
        this.loading = true;
        this.error = null;
        this._isActive = true;
        this._updateCount = 0;
        this._errorCount = 0;
      });
      
      // Initial load
      await this.loadSignalStatusForApproach(approachId, approachName, laneIds, lanesData);
      
      // Start rapid updates (2x per second)
      this.startPeriodicUpdates(approachId, approachName, laneIds, lanesData);
      
      runInAction(() => {
        this.loading = false;
      });
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'SPaT start failed';
      console.error('❌ SPaT monitoring start failed:', errorMessage);
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
        this._isActive = false;
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
    
    console.log(`🚦 SPaT monitoring stopped (${this._updateCount} updates, ${this._errorCount} errors)`);
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'One-time signal check failed';
      console.error('❌ One-time signal check failed:', errorMessage);
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
      this._updateCount++;
      this.error = null; // Clear error on successful update
    });
    
    // Log signal changes
    const prevSignal = this.currentApproachSignalStatus?.overallSignalState;
    if (prevSignal !== approachStatus.overallSignalState) {
      console.log(`🚦 Signal changed: ${prevSignal || 'UNKNOWN'} → ${approachStatus.overallSignalState}`);
    }
  }
  
  /**
   * Start periodic updates (2x per second)
   */
  private startPeriodicUpdates(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): void {
    console.log(`🔄 Starting rapid SPaT updates every ${SpatViewModel.UPDATE_INTERVAL_MS}ms`);
    
    this._updateInterval = setInterval(async () => {
      if (!this._isActive) return;
      
      try {
        await this.loadSignalStatusForApproach(approachId, approachName, laneIds, lanesData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'SPaT periodic update failed';
        console.error('❌ SPaT periodic update failed:', errorMessage);
        runInAction(() => {
          this._errorCount++;
          // Don't set error state for individual failed updates to avoid UI flicker
          // Only log the error and continue trying
        });
      }
    }, SpatViewModel.UPDATE_INTERVAL_MS);
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
  
  get updateCount(): number {
    return this._updateCount;
  }
  
  get errorCount(): number {
    return this._errorCount;
  }
  
  get updateRate(): number {
    return 1000 / SpatViewModel.UPDATE_INTERVAL_MS; // Updates per second
  }
  
  get isDataFresh(): boolean {
    if (!this._lastUpdateTime) return false;
    // Consider data fresh if updated within last 2 seconds
    return (Date.now() - this._lastUpdateTime) < 2000;
  }
  
  // ========================================
  // Utility Methods
  // ========================================
  
  /**
   * Force refresh signal data
   */
  public async refreshSignalData(): Promise<void> {
    if (!this.currentApproachSignalStatus) return;
    
    const { approachId, approachName, laneIds } = this.currentApproachSignalStatus;
    console.log('🚦 Force refresh requested');
    
    try {
      // Get fresh data from cache or API call for lane data
      // For now, we'll use empty array as we don't have the original lanesData stored
      await this.loadSignalStatusForApproach(approachId, approachName, laneIds, []);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Force refresh failed';
      console.error('❌ Force refresh failed:', errorMessage);
    }
  }
  
  /**
   * Get debug info
   */
  public getDebugInfo(): object {
    return {
      isMonitoring: this._isActive,
      updateInterval: SpatViewModel.UPDATE_INTERVAL_MS,
      updateCount: this._updateCount,
      errorCount: this._errorCount,
      lastUpdate: this._lastUpdateTime,
      timeSinceLastUpdate: this.timeSinceLastUpdate,
      hasData: this.hasSignalData,
      signalState: this.approachSignalState,
      intersection: this.currentSpatData?.intersection,
      spatTimestamp: this.currentSpatData?.timestamp
    };
  }
  
  /**
   * Test API connection
   */
  public async testConnection(): Promise<boolean> {
    return await SpatDataService.testConnection();
  }
  
  /**
   * Cleanup resources
   */
  public cleanup(): void {
    console.log('🧹 SPaT ViewModel cleanup');
    this.stopMonitoring();
    
    runInAction(() => {
      this.currentSpatData = null;
      this.currentApproachSignalStatus = null;
      this.error = null;
      this._lastUpdateTime = 0;
      this._updateCount = 0;
      this._errorCount = 0;
    });
  }
}