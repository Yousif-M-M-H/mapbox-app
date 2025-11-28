// app/src/features/SpatService/viewModels/SpatViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SignalState } from '../models/SpatModels';
import { SpatApiService } from '../services/SpatApiService';
import { SpatZoneService, SpatZone } from '../services/SpatZoneService';
import { HeadingService } from '../../Map/services/HeadingService';

// Store unsubscribe functions outside of observable state to avoid MobX warnings
const headingUnsubscribers = new WeakMap<SpatViewModel, () => void>();

export class SpatViewModel {
  signalState: SignalState = SignalState.UNKNOWN;
  currentLaneId: number | null = null;
  currentSignalGroup: number | null = null;
  currentIntersection: 'georgia' | 'houston' | null = null;
  currentZoneName: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  private userPosition: [number, number] = [0, 0];
  private userHeading: number = 0;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentZone: SpatZone | null = null;
  private lastZoneCheckTime: number = 0;

  private readonly FAST_UPDATE_INTERVAL = 250;
  private readonly ZONE_CHECK_THROTTLE = 100;

  // Lane 4 & 5: 250° to 300°
  private readonly LANE_4_5_HEADING_MIN = 250;
  private readonly LANE_4_5_HEADING_MAX = 320;

  // Lane 10 & 11: 100° to 190°
  private readonly LANE_10_11_HEADING_MIN = 100;
  private readonly LANE_10_11_HEADING_MAX = 190;

  // Hysteresis buffer to prevent flickering (degrees)
  private readonly HEADING_HYSTERESIS_BUFFER = 5;
  private isCurrentlyInValidHeadingRange: boolean = false;

  constructor() {
    makeAutoObservable(this);
  }

  setUserPosition(position: [number, number]): void {
    this.userPosition = position;

    const now = Date.now();
    if (now - this.lastZoneCheckTime >= this.ZONE_CHECK_THROTTLE) {
      this.lastZoneCheckTime = now;
      this.checkZoneAndUpdateState();
    }
  }

  private isHeadingInRange(heading: number, min: number, max: number, withHysteresis: boolean = true): boolean {
    // Normalize all values to 0-360 range
    const normalizedHeading = ((heading % 360) + 360) % 360;

    // Apply hysteresis buffer to prevent flickering at boundaries
    let effectiveMin = min;
    let effectiveMax = max;

    if (withHysteresis) {
      if (this.isCurrentlyInValidHeadingRange) {
        // Already in valid range - expand the boundaries (easier to stay in)
        effectiveMin = min - this.HEADING_HYSTERESIS_BUFFER;
        effectiveMax = max + this.HEADING_HYSTERESIS_BUFFER;
      } else {
        // Not in valid range - shrink the boundaries (harder to enter)
        effectiveMin = min + this.HEADING_HYSTERESIS_BUFFER;
        effectiveMax = max - this.HEADING_HYSTERESIS_BUFFER;
      }
    }

    const normalizedMin = ((effectiveMin % 360) + 360) % 360;
    const normalizedMax = effectiveMax % 360;

    // Check if range wraps around 360°/0° (e.g., 250° to 380° = 250° to 360° + 0° to 20°)
    if (effectiveMax > 360) {
      // Range wraps around: check if heading is >= min OR <= (max - 360)
      const wrappedMax = normalizedMax;
      return normalizedHeading >= normalizedMin || normalizedHeading <= wrappedMax;
    } else {
      // Normal range: simple comparison
      return normalizedHeading >= normalizedMin && normalizedHeading <= normalizedMax;
    }
  }

  private isHeadingValidForLanes4_5(): boolean {
    return this.isHeadingInRange(
      this.userHeading,
      this.LANE_4_5_HEADING_MIN,
      this.LANE_4_5_HEADING_MAX
    );
  }

  private isHeadingValidForLanes10_11(): boolean {
    return this.isHeadingInRange(
      this.userHeading,
      this.LANE_10_11_HEADING_MIN,
      this.LANE_10_11_HEADING_MAX
    );
  }

  startMonitoring(): void {
    if (this.updateInterval) return;

    this.checkZoneAndUpdateState();

    this.updateInterval = setInterval(() => {
      this.updateSpatData();
    }, this.FAST_UPDATE_INTERVAL);

    // Initialize heading tracking
    this.initializeHeadingTracking();
  }

  private async initializeHeadingTracking(): Promise<void> {
    // Don't re-initialize if already subscribed
    if (headingUnsubscribers.has(this)) {
      return;
    }

    try {
      await HeadingService.startTracking();

      const unsubscribe = HeadingService.subscribe((headingData) => {
        runInAction(() => {
          this.userHeading = headingData.heading;
          this.updateHeadingRangeState();
        });
      });

      // Store unsubscribe function outside observable state
      headingUnsubscribers.set(this, unsubscribe);
    } catch (error) {
      // Heading tracking failed - will default to 0
    }
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private checkZoneAndUpdateState(): void {
    const newZone = SpatZoneService.findZoneForPosition(this.userPosition);
    
    if (newZone?.id !== this.currentZone?.id) {
      this.currentZone = newZone;
      
      if (newZone) {
        this.enterZone(newZone);
      } else {
        this.exitZone();
      }
    }
  }

  private enterZone(zone: SpatZone): void {
    runInAction(() => {
      this.currentIntersection = zone.intersection;
      this.currentLaneId = zone.laneIds[0];
      this.currentSignalGroup = zone.signalGroup;
      this.currentZoneName = zone.name;
      this.error = null;
    });
    
    // START SPAT TRACKING when user enters zone
    
    this.fetchSpatDataImmediate(zone.intersection, zone.signalGroup);
  }

  private exitZone(): void {
    runInAction(() => {
      this.currentIntersection = null;
      this.currentLaneId = null;
      this.currentSignalGroup = null;
      this.currentZoneName = '';
      this.signalState = SignalState.UNKNOWN;
      this.error = null;
    });
  }

  private async updateSpatData(): Promise<void> {
    if (!this.currentZone || !this.currentIntersection || !this.currentSignalGroup) {
      return;
    }

    await this.fetchSpatDataImmediate(this.currentIntersection, this.currentSignalGroup);
  }

  private async fetchSpatDataImmediate(
    intersection: 'georgia' | 'houston',
    signalGroup: number
  ): Promise<void> {
    try {
      const spatData = await SpatApiService.fetchSpatData(intersection);
      
      if (!spatData) {
        runInAction(() => {
          this.error = 'No SPaT data';
        });
        return;
      }

      const signalState = SpatApiService.getSignalStateForGroup(spatData, signalGroup);

      runInAction(() => {
        this.signalState = signalState;
        this.error = null;
      });

    } catch (error) {
      runInAction(() => {
        this.error = 'SPaT fetch failed';
      });
    }
  }

  get shouldShowDisplay(): boolean {
    const hasValidData = this.currentLaneId !== null &&
                         this.currentSignalGroup !== null &&
                         this.signalState !== SignalState.UNKNOWN;

    if (!hasValidData) {
      return false;
    }

    // Apply heading check for Lane 4 and Lane 5
    const isLane4or5 = this.currentLaneId === 4 || this.currentLaneId === 5;
    if (isLane4or5) {
      return this.isHeadingValidForLanes4_5();
    }

    // Apply heading check for Lane 10 and Lane 11
    const isLane10or11 = this.currentLaneId === 10 || this.currentLaneId === 11;
    if (isLane10or11) {
      return this.isHeadingValidForLanes10_11();
    }

    // For other lanes, no heading restriction
    return true;
  }

  private updateHeadingRangeState(): void {
    // Update the hysteresis state based on current display status
    this.isCurrentlyInValidHeadingRange = this.shouldShowDisplay;
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
    if (!this.currentLaneId || !this.currentSignalGroup) return '';
    const intersectionPrefix = this.currentIntersection === 'georgia' ? 'GA' : 'HOU';
    return `${intersectionPrefix} L${this.currentLaneId} SG${this.currentSignalGroup}`;
  }

  cleanup(): void {
    this.stopMonitoring();
    this.currentZone = null;

    // Unsubscribe from heading updates
    const unsubscribe = headingUnsubscribers.get(this);
    if (unsubscribe) {
      unsubscribe();
      headingUnsubscribers.delete(this);
    }
  }
}