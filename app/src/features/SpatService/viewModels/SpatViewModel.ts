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
  private updateInterval: NodeJS.Timeout | null = null;
  private currentZone: SpatZone | null = null;
  private lastZoneCheckTime: number = 0;
  
  private readonly FAST_UPDATE_INTERVAL = 250;
  private readonly ZONE_CHECK_THROTTLE = 100;

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
    return this.currentLaneId !== null && 
           this.currentSignalGroup !== null && 
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
    if (!this.currentLaneId || !this.currentSignalGroup) return '';
    const intersectionPrefix = this.currentIntersection === 'georgia' ? 'GA' : 'HOU';
    return `${intersectionPrefix} L${this.currentLaneId} SG${this.currentSignalGroup}`;
  }

  cleanup(): void {
    this.stopMonitoring();
    this.currentZone = null;
  }
}