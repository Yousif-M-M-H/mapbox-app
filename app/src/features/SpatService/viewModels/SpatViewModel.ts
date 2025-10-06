// app/src/features/SpatService/viewModels/SpatViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SignalState } from '../models/SpatModels';
import { SpatApiService } from '../services/SpatApiService';
import { GEORGIA_INTERSECTION_LANES, HOUSTON_INTERSECTION_LANES } from '../../Lanes/constants/LaneData';

export class SpatViewModel {
  signalState: SignalState = SignalState.UNKNOWN;
  currentLaneId: number | null = null;
  currentSignalGroup: number | null = null;
  currentIntersection: 'georgia' | 'houston' | null = null;
  isLoading: boolean = false;
  error: string | null = null;
  isProximityBased: boolean = false;

  private userPosition: [number, number] = [0, 0];
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly EXACT_LANE_THRESHOLD = 0.00008;
  private readonly PROXIMITY_THRESHOLD = 0.00015;

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
      const georgiaLaneInfo = this.detectLaneWithProximity(this.userPosition, GEORGIA_INTERSECTION_LANES, 'georgia');
      const houstonLaneInfo = this.detectLaneWithProximity(this.userPosition, HOUSTON_INTERSECTION_LANES, 'houston');
      
      const laneInfo = georgiaLaneInfo || houstonLaneInfo;
      
      if (!laneInfo) {
        runInAction(() => {
          this.currentIntersection = null;
          this.currentLaneId = null;
          this.currentSignalGroup = null;
          this.signalState = SignalState.UNKNOWN;
          this.isProximityBased = false;
        });
        return;
      }

      const spatData = await SpatApiService.fetchSpatData(laneInfo.intersection);
      
      if (!spatData) {
        runInAction(() => {
          this.error = 'Failed to fetch SPaT data';
        });
        return;
      }

      const signalState = SpatApiService.getSignalStateForGroup(
        spatData, 
        laneInfo.signalGroup
      );

      runInAction(() => {
        this.currentIntersection = laneInfo.intersection;
        this.currentLaneId = laneInfo.laneId;
        this.currentSignalGroup = laneInfo.signalGroup;
        this.signalState = signalState;
        this.isProximityBased = laneInfo.isProximityBased;
        this.error = null;
      });

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }

  private detectLaneWithProximity(
    userPosition: [number, number],
    lanes: any[],
    intersection: 'georgia' | 'houston'
  ): {laneId: number; signalGroup: number; isProximityBased: boolean; intersection: 'georgia' | 'houston'} | null {
    
    for (const lane of lanes) {
      if (this.isUserInLane(userPosition, lane.geometry.coordinates, this.EXACT_LANE_THRESHOLD)) {
        const signalGroup = lane.connectsTo?.[0]?.signalGroup;
        if (signalGroup) {
          return { 
            laneId: lane.laneID, 
            signalGroup,
            isProximityBased: false,
            intersection
          };
        }
      }
    }

    let nearestLane: typeof lanes[0] | null = null;
    let minDistance = this.PROXIMITY_THRESHOLD;
    
    for (const lane of lanes) {
      if (!lane.connectsTo?.[0]?.signalGroup) continue;

      const distance = this.getDistanceToLane(userPosition, lane.geometry.coordinates);
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestLane = lane;
      }
    }
    
    if (nearestLane) {
      const signalGroup = nearestLane.connectsTo?.[0]?.signalGroup;
      if (signalGroup) {
        return { 
          laneId: nearestLane.laneID, 
          signalGroup,
          isProximityBased: true,
          intersection
        };
      }
    }

    return null;
  }

  private getDistanceToLane(
    userPosition: [number, number],
    laneCoordinates: [number, number][]
  ): number {
    const [userLat, userLng] = userPosition;
    let minDistance = Infinity;

    for (let i = 0; i < laneCoordinates.length - 1; i++) {
      const [lng1, lat1] = laneCoordinates[i];
      const [lng2, lat2] = laneCoordinates[i + 1];
      
      const distance = this.distanceToLineSegment(
        [userLat, userLng],
        [lat1, lng1],
        [lat2, lng2]
      );

      minDistance = Math.min(minDistance, distance);
    }

    return minDistance;
  }

  private isUserInLane(
    userPosition: [number, number],
    laneCoordinates: [number, number][],
    threshold: number = this.EXACT_LANE_THRESHOLD
  ): boolean {
    const [userLat, userLng] = userPosition;

    for (let i = 0; i < laneCoordinates.length - 1; i++) {
      const [lng1, lat1] = laneCoordinates[i];
      const [lng2, lat2] = laneCoordinates[i + 1];
      
      const distance = this.distanceToLineSegment(
        [userLat, userLng],
        [lat1, lng1],
        [lat2, lng2]
      );

      if (distance <= threshold) {
        return true;
      }
    }

    return false;
  }

  private distanceToLineSegment(
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;

    const lineLength2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (lineLength2 === 0) {
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }

    const t = Math.max(0, Math.min(1,
      ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLength2
    ));

    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);

    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
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
    const proximityIndicator = this.isProximityBased ? '~' : '';
    const intersectionPrefix = this.currentIntersection === 'georgia' ? 'GA' : 'HOU';
    return `${intersectionPrefix} L${this.currentLaneId}${proximityIndicator} SG${this.currentSignalGroup}`;
  }

  cleanup(): void {
    this.stopMonitoring();
  }
}