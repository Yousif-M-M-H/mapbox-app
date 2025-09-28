// app/src/features/SpatService/viewModels/SpatViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SignalState } from '../models/SpatModels';
import { SpatApiService } from '../services/SpatApiService';
import { EnhancedLaneDetectionService, LaneDetectionResult } from '../services/EnhancedLaneDetectionService';

export class SpatViewModel {
  // Observable state
  signalState: SignalState = SignalState.UNKNOWN;
  currentLaneInfo: LaneDetectionResult = {
    isInLane: false,
    intersection: null,
    laneId: null,
    signalGroup: null,
    laneName: 'Not in any lane'
  };
  isLoading: boolean = false;
  error: string | null = null;
  lastUpdateTime: number = 0;

  // Private state
  private updateInterval: NodeJS.Timeout | null = null;
  private userPosition: [number, number] = [0, 0];
  private lastApiCall: number = 0;
  private readonly API_THROTTLE_MS = 1000; // Minimum 1 second between API calls
  private currentIntersection: 'georgia' | 'houston' | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  // ========================================
  // Public Methods
  // ========================================

  /**
   * Set the current intersection (called by ClosestIntersectionViewModel)
   */
  setCurrentIntersection(intersection: 'georgia' | 'houston' | null): void {
    if (this.currentIntersection !== intersection) {
      console.log(`🚦 SPaT intersection changed to: ${intersection || 'none'}`);
      this.currentIntersection = intersection;
      
      // Update API service with new intersection
      SpatApiService.setCurrentIntersection(intersection);
      
      // Reset signal state when changing intersections
      runInAction(() => {
        this.signalState = SignalState.UNKNOWN;
        this.error = null;
      });
      
      // If we have a valid intersection and are in a lane, update immediately
      if (intersection && this.currentLaneInfo.isInLane) {
        this.updateSignalState();
      }
    }
  }

  /**
   * Set user position and trigger lane detection
   */
  setUserPosition(position: [number, number]): void {
    this.userPosition = position;
    this.detectLaneAndUpdateSignal();
  }

  /**
   * Start monitoring SPaT data
   */
  startMonitoring(): void {
    if (this.updateInterval) {
      return; // Already monitoring
    }

    console.log('🚦 Starting SPaT monitoring');

    // Update immediately
    this.detectLaneAndUpdateSignal();

    // Update every second
    this.updateInterval = setInterval(() => {
      this.detectLaneAndUpdateSignal();
    }, 1000);
  }

  /**
   * Stop monitoring SPaT data
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('🚦 Stopped SPaT monitoring');
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    runInAction(() => {
      this.signalState = SignalState.UNKNOWN;
      this.currentLaneInfo = {
        isInLane: false,
        intersection: null,
        laneId: null,
        signalGroup: null,
        laneName: 'Not in any lane'
      };
      this.error = null;
    });
  }

  // ========================================
  // Computed Properties
  // ========================================

  get hasSignalData(): boolean {
    return this.currentLaneInfo.isInLane && 
           this.currentLaneInfo.signalGroup !== null && 
           this.signalState !== SignalState.UNKNOWN;
  }

  get signalStatusText(): string {
    switch (this.signalState) {
      case SignalState.GREEN: return 'GO';
      case SignalState.YELLOW: return 'CAUTION';
      case SignalState.RED: return 'STOP';
      default: return 'NO SIGNAL';
    }
  }

  get signalColor(): string {
    switch (this.signalState) {
      case SignalState.GREEN: return '#22c55e';
      case SignalState.YELLOW: return '#eab308';
      case SignalState.RED: return '#ef4444';
      default: return '#9ca3af';
    }
  }

  get laneDisplayText(): string {
    if (!this.currentLaneInfo.isInLane) return '';
    
    const intersection = this.currentLaneInfo.intersection === 'georgia' ? 'GA' : 'HOU';
    const signalGroup = this.currentLaneInfo.signalGroup || '?';
    
    return `${intersection} L${this.currentLaneInfo.laneId} SG${signalGroup}`;
  }

  get shouldShowDisplay(): boolean {
    return this.hasSignalData && this.currentIntersection !== null;
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Detect current lane and update signal state
   */
  private async detectLaneAndUpdateSignal(): Promise<void> {
    try {
      // Detect which lane the user is in
      const laneInfo = EnhancedLaneDetectionService.detectUserLane(this.userPosition);
      
      // Update lane info
      const laneChanged = this.hasLaneChanged(laneInfo);
      runInAction(() => {
        this.currentLaneInfo = laneInfo;
      });

      // Only proceed if we're in a lane and have a signal group
      if (laneInfo.isInLane && laneInfo.signalGroup !== null) {
        // Check if we need to switch intersection
        if (laneInfo.intersection !== this.currentIntersection) {
          console.log(`🚦 Lane detection found different intersection: ${laneInfo.intersection}`);
          // Note: This should be handled by ClosestIntersectionViewModel
          // but we can set it here as a fallback
          this.setCurrentIntersection(laneInfo.intersection);
        }

        // Update signal state if we have the right intersection set
        if (this.currentIntersection === laneInfo.intersection) {
          await this.updateSignalState();
        }
      } else {
        // Not in a lane - clear signal state
        runInAction(() => {
          this.signalState = SignalState.UNKNOWN;
          this.error = null;
        });
      }

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.signalState = SignalState.UNKNOWN;
      });
    }
  }

  /**
   * Update signal state from SPaT API
   */
  private async updateSignalState(): Promise<void> {
    // Throttle API calls
    const now = Date.now();
    if (now - this.lastApiCall < this.API_THROTTLE_MS) {
      return;
    }

    // Must have a valid lane and intersection
    if (!this.currentLaneInfo.isInLane || 
        !this.currentLaneInfo.signalGroup || 
        !this.currentIntersection) {
      return;
    }

    runInAction(() => {
      this.isLoading = true;
      this.error = null;
    });

    try {
      this.lastApiCall = now;
      const spatData = await SpatApiService.fetchSpatData();

      if (!spatData) {
        runInAction(() => {
          this.signalState = SignalState.UNKNOWN;
          this.error = 'Failed to fetch SPaT data';
        });
        return;
      }

      const newSignalState = SpatApiService.getSignalStateForGroup(
        spatData, 
        this.currentLaneInfo.signalGroup
      );

      runInAction(() => {
        this.signalState = newSignalState;
        this.lastUpdateTime = Date.now();
        this.error = null;
      });

      // Log state change
      if (newSignalState !== SignalState.UNKNOWN) {
        console.log(
          `🚦 Signal: ${newSignalState} for ${this.currentLaneInfo.laneName} (SG${this.currentLaneInfo.signalGroup})`
        );
      }

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to update signal state';
        this.signalState = SignalState.UNKNOWN;
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * Check if the detected lane has changed
   */
  private hasLaneChanged(newLaneInfo: LaneDetectionResult): boolean {
    return this.currentLaneInfo.laneId !== newLaneInfo.laneId ||
           this.currentLaneInfo.intersection !== newLaneInfo.intersection;
  }

  /**
   * Get debug information
   */
  getDebugInfo(): string {
    return JSON.stringify({
      intersection: this.currentIntersection,
      lane: this.currentLaneInfo.laneId,
      signalGroup: this.currentLaneInfo.signalGroup,
      signalState: this.signalState,
      position: this.userPosition.map(v => v.toFixed(6)),
      hasSignalData: this.hasSignalData
    }, null, 2);
  }
}