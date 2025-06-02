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
 * ViewModel for the Direction Guide feature (SIMPLE VERSION)
 * Shows combined turns for the 2 lanes on the vehicle's approach direction
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
        console.log(`🚗 Vehicle within 40m - showing turns for ${this.approachDirection} approach`);
        if (this.intersectionData) {
          console.log(`📊 Showing combined turns from ${this.intersectionData.totalLanes} lanes`);
        }
      } else {
        console.log(`🚗 Vehicle moved away from intersection`);
      }
    }
  }
  
  /**
   * Calculate distance between two points
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lon2 - lon1, 2));
  }
  
  /**
   * Initialize with approach-specific data (SIMPLE VERSION)
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);
      
      console.log('🚀 Initializing DirectionGuide (SIMPLE approach-based)...');
      
      // 1. Determine approach direction from vehicle position
      const approachDirection = determineApproachDirection(CAR_POSITION, MLK_INTERSECTION_POSITION);
      console.log(`📍 Vehicle approaching from: ${approachDirection}`);
      
      // 2. Fetch ALL lanes data
      const allLanesData = await MapDataService.fetchAllLanesData();
      
      // 3. Process ONLY the lanes for this approach direction
      const processedData = MapDataService.processApproachData(allLanesData, approachDirection);
      
      runInAction(() => {
        this.intersectionData = processedData;
        this.loading = false;
      });
      
      console.log('✅ Direction Guide initialized');
      console.log(`📋 Approach: ${approachDirection} (${processedData.totalLanes} lanes)`);
      console.log(`🎯 Combined turns: ${processedData.allAllowedTurns.filter(t => t.allowed).map(t => t.type).join(', ')}`);
      
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'An unknown error occurred';
        this.loading = false;
      });
      console.error('Error initializing DirectionGuideViewModel:', error);
    }
  }
  
  /**
   * Static test method
   */
  static async runTest(): Promise<void> {
    console.log('\n🧪 === SIMPLE DIRECTION GUIDE TEST ===');
    
    try {
      // Show direction calculation
      logDirectionDetails(CAR_POSITION, MLK_INTERSECTION_POSITION);
      
      // Test the simple approach
      const testViewModel = new DirectionGuideViewModel();
      
      // Wait for initialization
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          if (!testViewModel.loading && (testViewModel.intersectionData || testViewModel.error)) {
            testViewModel.error ? reject(new Error(testViewModel.error)) : resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
      
      // Show results
      if (testViewModel.intersectionData) {
        console.log('📊 Simple Test Results:');
        console.log(`- Intersection: ${testViewModel.intersectionData.intersectionName}`);
        console.log(`- Approach: ${testViewModel.intersectionData.approachDirection}`);
        console.log(`- Lanes Combined: ${testViewModel.intersectionData.totalLanes}`);
        console.log('- Available Turns:');
        testViewModel.allowedTurns.forEach(turn => {
          console.log(`  ${turn.type}: ${turn.allowed ? '✅' : '❌'}`);
        });
        
        // Test proximity
        testViewModel.setVehiclePosition(CAR_POSITION);
        console.log(`- Turn Guide Visible: ${testViewModel.showTurnGuide ? '✅' : '❌'}`);
      }
      
      console.log('✅ Simple test completed');
      
    } catch (error) {
      console.error('❌ Simple test failed:', error);
      throw error;
    }
    
    console.log('🧪 === END SIMPLE TEST ===\n');
  }
  
  /**
   * Get the current approach direction
   */
  get approachDirection(): ApproachDirection {
    return this.intersectionData?.approachDirection || ApproachDirection.UNKNOWN;
  }
  
  /**
   * Get combined allowed turns for this approach
   */
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  /**
   * Get number of lanes for this approach
   */
  get totalLanes(): number {
    return this.intersectionData?.totalLanes || 0;
  }
  
  /**
   * Check if a turn type is allowed
   */
  isTurnAllowed(turnType: string): boolean {
    const turn = this.allowedTurns.find(t => t.type === turnType);
    return turn?.allowed || false;
  }
  
  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loading = loading;
  }
  
  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.error = error;
  }
}