// app/src/features/SpatService/viewModels/SpatViewModel.ts
// PRODUCTION VERSION: Enhanced lane detection with proximity fallback

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
  isProximityBased: boolean = false;

  // Private state
  private userPosition: [number, number] = [0, 0];
  private updateInterval: NodeJS.Timeout | null = null;

  // Detection thresholds
  private readonly EXACT_LANE_THRESHOLD = 0.00005; // ~5 meters
  private readonly PROXIMITY_THRESHOLD = 0.00012;  // ~12 meters

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
    }, 1000);
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
      // Check if user is in Georgia polygon
      const isInGeorgia = this.checkPolygon(this.userPosition);
      
      if (!isInGeorgia) {
        runInAction(() => {
          this.currentIntersection = null;
          this.currentLaneId = null;
          this.currentSignalGroup = null;
          this.signalState = SignalState.UNKNOWN;
          this.isProximityBased = false;
        });
        return;
      }

      // Call SPaT API for Georgia
      const spatData = await SpatApiService.fetchSpatData('georgia');
      
      if (!spatData) {
        runInAction(() => {
          this.error = 'Failed to fetch SPaT data';
          this.signalState = SignalState.UNKNOWN;
        });
        return;
      }

      // Determine which lane user is in (with proximity fallback)
      const laneInfo = this.detectLaneWithProximity(this.userPosition);
      
      if (!laneInfo) {
        runInAction(() => {
          this.currentIntersection = 'georgia';
          this.currentLaneId = null;
          this.currentSignalGroup = null;
          this.signalState = SignalState.UNKNOWN;
          this.isProximityBased = false;
        });
        return;
      }

      // Get signal state from SPaT data
      const signalState = SpatApiService.getSignalStateForGroup(
        spatData, 
        laneInfo.signalGroup
      );

      // Update state
      runInAction(() => {
        this.currentIntersection = 'georgia';
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

  /**
   * Detect lane with proximity fallback
   */
  private detectLaneWithProximity(
    userPosition: [number, number]
  ): {laneId: number; signalGroup: number; isProximityBased: boolean} | null {
    const lanes = GEORGIA_INTERSECTION_LANES;

    // Pass 1: Try exact lane detection
    for (const lane of lanes) {
      if (this.isUserInLane(userPosition, lane.geometry.coordinates, this.EXACT_LANE_THRESHOLD)) {
        const signalGroup = lane.connectsTo?.[0]?.signalGroup;
        if (signalGroup) {
          return { 
            laneId: lane.laneID, 
            signalGroup,
            isProximityBased: false 
          };
        }
      }
    }

    // Pass 2: Find nearest lane within proximity threshold
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
          isProximityBased: true
        };
      }
    }

    return null;
  }

  /**
   * Calculate minimum distance from user to any point on a lane
   */
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

  /**
   * Check if user is in Georgia polygon
   */
  private checkPolygon(userPosition: [number, number]): boolean {
    const [lat, lng] = userPosition;
    return this.isPointInPolygon([lat, lng], INTERSECTION_POLYGONS[0].polygon);
  }

  /**
   * Check if user is in a lane with configurable threshold
   */
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
    const proximityIndicator = this.isProximityBased ? '~' : '';
    return `GA L${this.currentLaneId}${proximityIndicator} SG${this.currentSignalGroup}`;
  }

  cleanup(): void {
    this.stopMonitoring();
  }
}