// app/src/features/SpatService/viewModels/SpatViewModel.ts
// ViewModel responsible for SPaT state management and business logic

import { makeAutoObservable, runInAction } from 'mobx';
import { SignalState } from '../models/SpatModels';
import { SpatApiService, SpatApiResponse } from '../services/SpatApiService';
import { LaneDetectionService, LaneDefinition } from '../services/LaneDetectionService';

export class SpatViewModel {
  // Observable state
  signalState: SignalState = SignalState.UNKNOWN;
  currentLane: LaneDefinition | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  lastUpdateTime: number = 0;

  // Private state
  private updateInterval: NodeJS.Timeout | null = null;
  private userPosition: [number, number] = [0, 0];
  private lastApiCall: number = 0;
  private readonly API_THROTTLE_MS = 2000; // Minimum 2 seconds between API calls
  private lastLaneChangeTime: number = 0;
  private readonly LANE_CHANGE_DEBOUNCE_MS = 1000; // Prevent rapid lane changes

  constructor() {
    makeAutoObservable(this);
  }

  // ========================================
  // Public Methods
  // ========================================

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

    // Update immediately
    this.detectLaneAndUpdateSignal();

    // Update every 1 second for SPaT API calls
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
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.signalState = SignalState.UNKNOWN;
    this.currentLane = null;
    this.error = null;
  }

  // ========================================
  // Computed Properties
  // ========================================

  get hasSignalData(): boolean {
    return this.currentLane !== null && this.signalState !== SignalState.UNKNOWN;
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
    if (!this.currentLane) return '';
    const signalGroup = this.currentLane.signalGroup;
    return `L${this.currentLane.id} SG${signalGroup}`;
  }

  get shouldShowDisplay(): boolean {
    return this.hasSignalData;
  }

  // ========================================
  // Private Methods
  // ========================================

  /**
   * Detect current lane and update signal state
   */
  private async detectLaneAndUpdateSignal(): Promise<void> {
    try {
      // Detect closest lane
      const closestLane = LaneDetectionService.findClosestLane(this.userPosition);

      // Only update if lane changed with debouncing
      if (this.hasLaneChanged(closestLane)) {
        const now = Date.now();
        if (now - this.lastLaneChangeTime > this.LANE_CHANGE_DEBOUNCE_MS) {
          runInAction(() => {
            this.currentLane = closestLane;
          });
          this.lastLaneChangeTime = now;
        } else {
          // Too soon for lane change, keep current lane
          return;
        }
      }

      // Update signal state if we have a lane
      if (this.currentLane) {
        await this.updateSignalStateForLane(this.currentLane);
      } else {
        // No lane detected
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
   * Update signal state for a specific lane
   */
  private async updateSignalStateForLane(lane: LaneDefinition): Promise<void> {
    // Throttle API calls to prevent flashing
    const now = Date.now();
    if (now - this.lastApiCall < this.API_THROTTLE_MS) {
      return; // Skip this update
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

      const newSignalState = SpatApiService.getSignalStateForGroup(spatData, lane.signalGroup);

      // Only update if signal state actually changed
      runInAction(() => {
        if (newSignalState !== this.signalState) {
          this.signalState = newSignalState;
        }
        this.lastUpdateTime = Date.now();
        this.error = null;
      });

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
  private hasLaneChanged(newLane: LaneDefinition | null): boolean {
    if (!this.currentLane && !newLane) return false;
    if (!this.currentLane || !newLane) return true;
    return this.currentLane.id !== newLane.id;
  }
}