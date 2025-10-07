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

  constructor() {
    makeAutoObservable(this);
  }

  setUserPosition(position: [number, number]): void {
    this.userPosition = position;
    this.checkSpatStatus();
  }

  startMonitoring(): void {
    if (this.updateInterval) return;
    
    this.checkSpatStatus();
    
    this.updateInterval = setInterval(() => {
      this.checkSpatStatus();
    }, 1000);
  }

  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private async checkSpatStatus(): Promise<void> {
    try {
      const zone = SpatZoneService.findZoneForPosition(this.userPosition);
      
      if (!zone) {
        runInAction(() => {
          this.currentIntersection = null;
          this.currentLaneId = null;
          this.currentSignalGroup = null;
          this.currentZoneName = '';
          this.signalState = SignalState.UNKNOWN;
        });
        return;
      }

      const spatData = await SpatApiService.fetchSpatData(zone.intersection);
      
      if (!spatData) {
        runInAction(() => {
          this.error = 'Failed to fetch SPaT data';
        });
        return;
      }

      const signalState = SpatApiService.getSignalStateForGroup(
        spatData, 
        zone.signalGroup
      );

      runInAction(() => {
        this.currentIntersection = zone.intersection;
        this.currentLaneId = zone.laneIds[0];
        this.currentSignalGroup = zone.signalGroup;
        this.currentZoneName = zone.name;
        this.signalState = signalState;
        this.error = null;
      });

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
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
  }
}