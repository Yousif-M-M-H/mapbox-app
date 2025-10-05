// app/src/features/SpatService/viewModels/SpatViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SignalState } from '../models/SpatModels';
import { SpatApiService } from '../services/SpatApiService';
import { INTERSECTION_POLYGONS } from '../../ClosestIntersection/constants/IntersectionDefinitions';
import { GEORGIA_INTERSECTION_LANES } from '../../Lanes/constants/LaneData';

export class SpatViewModel {
  // Observable state
  signalState: SignalState = SignalState.UNKNOWN;
  currentLaneId: number | null = null;
  currentSignalGroup: number | null = null;
  currentIntersection: 'georgia' | null = null;
  isLoading: boolean = false;
  error: string | null = null;

  // Private state
  private userPosition: [number, number] = [0, 0];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Set user position and trigger SPaT logic
   */
  setUserPosition(position: [number, number]): void {
    this.userPosition = position;
    this.checkSpatStatus();
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      this.checkSpatStatus();
    }, 1000); // Check every second
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Main SPaT logic - Georgia only
   */
  private async checkSpatStatus(): Promise<void> {
    try {
      // Step 1: Check if user is in Georgia polygon
      const isInGeorgia = this.checkPolygon(this.userPosition);
      
      if (!isInGeorgia) {
        // User not in Georgia polygon - clear everything
        runInAction(() => {
          this.currentIntersection = null;
          this.currentLaneId = null;
          this.currentSignalGroup = null;
          this.signalState = SignalState.UNKNOWN;
        });
        return;
      }

      // Step 2: Call SPaT API for Georgia
      const spatData = await SpatApiService.fetchSpatData('georgia');
      
      if (!spatData) {
        runInAction(() => {
          this.error = 'Failed to fetch SPaT data';
          this.signalState = SignalState.UNKNOWN;
        });
        return;
      }

      // Step 3: Determine which lane user is in
      const laneInfo = this.detectLane(this.userPosition);
      
      if (!laneInfo) {
        // User not in any lane
        runInAction(() => {
          this.currentIntersection = 'georgia';
          this.currentLaneId = null;
          this.currentSignalGroup = null;
          this.signalState = SignalState.UNKNOWN;
        });
        return;
      }

      // Step 4: Get signal state from SPaT data
      const signalState = SpatApiService.getSignalStateForGroup(
        spatData, 
        laneInfo.signalGroup
      );

      // Step 5: Update state
      runInAction(() => {
        this.currentIntersection = 'georgia';
        this.currentLaneId = laneInfo.laneId;
        this.currentSignalGroup = laneInfo.signalGroup;
        this.signalState = signalState;
        this.error = null;
      });

      console.log(`🚦 GEORGIA: Lane ${laneInfo.laneId}, SG${laneInfo.signalGroup} = ${signalState}`);

    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }

  /**
   * Check if user is in Georgia polygon
   */
  private checkPolygon(userPosition: [number, number]): boolean {
    const [lat, lng] = userPosition;
    
    // Check Georgia polygon (first and only)
    return this.isPointInPolygon([lat, lng], INTERSECTION_POLYGONS[0].polygon);
  }

  /**
   * Detect which lane user is in (Georgia only)
   */
  private detectLane(
    userPosition: [number, number]
  ): {laneId: number; signalGroup: number } | null {
    const lanes = GEORGIA_INTERSECTION_LANES;

    for (const lane of lanes) {
      if (this.isUserInLane(userPosition, lane.geometry.coordinates)) {
        const signalGroup = lane.connectsTo?.[0]?.signalGroup;
        if (signalGroup) {
          return { laneId: lane.laneID, signalGroup };
        }
      }
    }

    return null;
  }

  /**
   * Check if user is in a lane
   */
  private isUserInLane(
    userPosition: [number, number],
    laneCoordinates: [number, number][]
  ): boolean {
    const [userLat, userLng] = userPosition;
    const threshold = 0.00004; // ~4 meters

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

  /**
   * Point in polygon check (ray casting)
   */
  private isPointInPolygon(
    point: [number, number],
    polygon: [number, number][]
  ): boolean {
    const [lat, lng] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const [lngI, latI] = polygon[i];
      const [lngJ, latJ] = polygon[j];

      if (((latI > lat) !== (latJ > lat)) &&
          (lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Distance from point to line segment
   */
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

  /**
   * Computed properties for UI
   */
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
    return `GA L${this.currentLaneId} SG${this.currentSignalGroup}`;
  }

  cleanup(): void {
    this.stopMonitoring();
  }
}