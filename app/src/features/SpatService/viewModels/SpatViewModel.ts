// app/src/features/SpatService/viewModels/SpatViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SignalState } from '../models/SpatModels';
import { SpatApiService } from '../services/SpatApiService';
import { SpatZoneService, SpatZone } from '../services/SpatZoneService';

export class SpatViewModel {
  signalState: SignalState = SignalState.UNKNOWN;
  currentLaneId: number | null = null;
  currentSignalGroup: number | null = null;
  currentIntersection: 'georgia' | 'houston' | null = null;
  currentZoneName: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  private userPosition: [number, number] = [0, 0];
  private previousPosition: [number, number] | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private currentZone: SpatZone | null = null;
  private lastZoneCheckTime: number = 0;

  // Track if user has entered lanes and should display SPAT
  private shouldDisplayLane4_5: boolean = false;
  private shouldDisplayLane10_11: boolean = false;

  private readonly FAST_UPDATE_INTERVAL = 500;
  private readonly ZONE_CHECK_THROTTLE = 100;

  constructor() {
    makeAutoObservable(this);
  }

  setUserPosition(position: [number, number]): void {
    // Track segment: previousPosition -> currentPosition
    if (this.previousPosition && this.previousPosition[0] !== 0 && this.previousPosition[1] !== 0) {
      this.checkLineCrossing(this.previousPosition, position);
    }

    this.userPosition = position;
    this.previousPosition = position;

    const now = Date.now();
    if (now - this.lastZoneCheckTime >= this.ZONE_CHECK_THROTTLE) {
      this.lastZoneCheckTime = now;
      this.checkZoneAndUpdateState();
    }
  }

  private checkLineCrossing(prevPos: [number, number], currPos: [number, number]): void {
    // Only check line crossing for lanes with entry/exit logic
    // Check both zones since user might be transitioning between them
    this.checkLane4_5Crossing(prevPos, currPos);
    this.checkLane10_11Crossing(prevPos, currPos);
  }

  private checkLane4_5Crossing(prevPos: [number, number], currPos: [number, number]): void {
    const lane4_5Zone = SpatZoneService.findZoneById('georgia_lanes_4_5');
    if (!lane4_5Zone) return;

    // Check if segment crosses entry line (entering zone)
    if (SpatZoneService.crossesEntryLine(prevPos, currPos, lane4_5Zone)) {
      this.shouldDisplayLane4_5 = true;
      return;
    }

    if (SpatZoneService.crossesExitLine(prevPos, currPos, lane4_5Zone)) {
      this.shouldDisplayLane4_5 = false;
      return;
    }

    // Both dots inside OR both dots outside - Do NOTHING (keep current state)
    // State only changes when crossing entry/exit lines
  }

  private checkLane10_11Crossing(prevPos: [number, number], currPos: [number, number]): void {
    const lane10_11Zone = SpatZoneService.findZoneById('georgia_lanes_10_11');
    if (!lane10_11Zone) return;

    // Check if segment crosses entry line (entering zone)
    if (SpatZoneService.crossesEntryLine(prevPos, currPos, lane10_11Zone)) {
      this.shouldDisplayLane10_11 = true;
      return;
    }

    if (SpatZoneService.crossesExitLine(prevPos, currPos, lane10_11Zone)) {
      this.shouldDisplayLane10_11 = false;
      return;
    }

    // Both dots inside OR both dots outside - Do NOTHING (keep current state)
    // State only changes when crossing entry/exit lines
  }


  startMonitoring(): void {
    if (this.updateInterval) return;

    this.checkZoneAndUpdateState();

    this.updateInterval = setInterval(() => {
      this.updateSpatData();
    }, this.FAST_UPDATE_INTERVAL);
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
    // Note: SPAT will only DISPLAY after crossing entry line
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

    // Reset display flags
    this.shouldDisplayLane4_5 = false;
    this.shouldDisplayLane10_11 = false;
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

    if (!hasValidData) return false;

    // Lane 4 & 5: Use entry/exit line logic
    const isLane4or5 = this.currentLaneId === 4 || this.currentLaneId === 5;
    if (isLane4or5) {
      return this.shouldDisplayLane4_5;
    }

    // Lane 10 & 11: Use entry/exit line logic
    const isLane10or11 = this.currentLaneId === 10 || this.currentLaneId === 11;
    if (isLane10or11) {
      return this.shouldDisplayLane10_11;
    }

    // Other lanes: Simple zone-only logic
    return true;
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
    this.previousPosition = null;
    this.shouldDisplayLane4_5 = false;
    this.shouldDisplayLane10_11 = false;
  }
}