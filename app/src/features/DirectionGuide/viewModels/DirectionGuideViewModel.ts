// app/src/features/DirectionGuide/viewModels/DirectionGuideViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection } from '../models/DirectionTypes';
import { CAR_POSITION, MLK_INTERSECTION_POSITION } from '../constants/TestConstants';
import { determineApproachDirection, logDirectionDetails } from '../utils/DirectionUtils';

// 40 meters in coordinate units (approximately)
const INTERSECTION_PROXIMITY_DISTANCE = 0.0004; // ~40 meters

/**
 * ViewModel for the Direction Guide feature
 * Handles the business logic and state management for ALL lanes
 */
export class DirectionGuideViewModel {
  // Observable state
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  // Vehicle position tracking
  private _vehiclePosition: [number, number] = [0, 0];
  showTurnGuide: boolean = false;
  
  constructor() {
    makeAutoObservable(this);
    this.initialize();
  }
  
  // Getter for vehicle position
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  // Setter for vehicle position
  setVehiclePosition(position: [number, number]): void {
    this._vehiclePosition = position;
    this.checkProximityToIntersection();
  }
  
  /**
   * Check if vehicle is within 40 meters of intersection
   */
  private checkProximityToIntersection(): void {
    if (this._vehiclePosition[0] === 0 && this._vehiclePosition[1] === 0) {
      return; // No valid position yet
    }
    
    const distance = this.calculateDistance(
      this._vehiclePosition[0], this._vehiclePosition[1],
      MLK_INTERSECTION_POSITION[0], MLK_INTERSECTION_POSITION[1]
    );
    
    const isWithin40Meters = distance <= INTERSECTION_PROXIMITY_DISTANCE;
    
    if (isWithin40Meters !== this.showTurnGuide) {
      runInAction(() => {
        this.showTurnGuide = isWithin40Meters;
      });
      
      if (isWithin40Meters) {
        console.log(`🚗 Vehicle within 40m of intersection - showing ALL LANES turn guide`);
        if (this.intersectionData) {
          console.log(`📊 Showing turns from ${this.intersectionData.totalLanes} lanes combined`);
        }
      } else {
        console.log(`🚗 Vehicle moved away from intersection - hiding turn guide`);
      }
    }
  }
  
  /**
   * Calculate distance between two points (same as pedestrian detector)
   */
  private calculateDistance(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) + 
      Math.pow(lon2 - lon1, 2)
    );
  }
  
  /**
   * Initialize the view model with ALL lanes intersection data
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);
      
      console.log('🚀 Initializing DirectionGuide with ALL lanes data...');
      
      // Calculate approach direction using fixed position for now
      const approachDirection = determineApproachDirection(
        CAR_POSITION, 
        MLK_INTERSECTION_POSITION
      );
      
      // Fetch ALL lanes data and process
      const allLanesData = await MapDataService.fetchAllLanesData();
      const processedData = MapDataService.processAllLanesData(
        allLanesData,
        approachDirection
      );
      
      runInAction(() => {
        this.intersectionData = processedData;
        this.loading = false;
      });
      
      console.log('✅ Direction Guide initialized with ALL lanes turn data');
      console.log(`📋 Total lanes processed: ${processedData.totalLanes}`);
      console.log(`🎯 Combined allowed turns: ${processedData.allAllowedTurns.filter(t => t.allowed).map(t => t.type).join(', ')}`);
      
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'An unknown error occurred';
        this.loading = false;
      });
      console.error('Error initializing DirectionGuideViewModel:', error);
    }
  }
  
  /**
   * Get the current approach direction
   */
  get approachDirection(): ApproachDirection {
    return this.intersectionData?.approachDirection || ApproachDirection.UNKNOWN;
  }
  
  /**
   * Get ALL allowed turns (combined from all lanes)
   */
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  /**
   * Get the number of lanes processed
   */
  get totalLanes(): number {
    return this.intersectionData?.totalLanes || 0;
  }
  
  /**
   * Check if a turn type is allowed (from ANY lane)
   */
  isTurnAllowed(turnType: string): boolean {
    const turn = this.allowedTurns.find(t => t.type === turnType);
    return turn?.allowed || false;
  }
  
  /**
   * Set the loading state
   */
  setLoading(loading: boolean): void {
    this.loading = loading;
  }
  
  /**
   * Set the error state
   */
  setError(error: string | null): void {
    this.error = error;
  }
}