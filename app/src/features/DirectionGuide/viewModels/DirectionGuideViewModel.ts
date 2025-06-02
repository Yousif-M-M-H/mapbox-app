// app/src/features/DirectionGuide/viewModels/DirectionGuideViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection } from '../models/DirectionTypes';
import { CAR_POSITION } from '../constants/TestConstants';
import { ApproachPolygon } from '../constants/ApproachPolygonConfig';
import { detectApproachPolygon, logPolygonDetectionDetails } from '../utils/PolygonDetectionUtils';

/**
 * ViewModel for the Direction Guide feature (POLYGON-BASED VERSION)
 * Shows combined turns when vehicle enters specific approach polygon zones
 * 
 * 🚗 USES REAL GPS DATA - Vehicle position is updated by MapView component
 */
export class DirectionGuideViewModel {
  // Observable state
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  // Vehicle position tracking (updated by real GPS)
  private _vehiclePosition: [number, number] = [0, 0];
  showTurnGuide: boolean = false;
  
  // Current approach polygon (if any)
  private _currentApproachPolygon: ApproachPolygon | null = null;
  
  // Debug flag to track GPS updates
  private _hasReceivedGPSUpdate: boolean = false;
  
  constructor() {
    makeAutoObservable(this);
    this.initialize();
  }
  
  // Getter for vehicle position
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  // Getter to check if we've received real GPS data
  get hasReceivedGPS(): boolean {
    return this._hasReceivedGPSUpdate;
  }
  
  /**
   * Setter for vehicle position - CALLED BY REAL GPS FROM MapView
   * This is the main entry point for live GPS updates
   */
  setVehiclePosition(position: [number, number]): void {
    // Mark that we've received real GPS data
    if (!this._hasReceivedGPSUpdate && position[0] !== 0 && position[1] !== 0) {
      this._hasReceivedGPSUpdate = true;
      console.log('🌍 DirectionGuide: Received first real GPS update:', position);
    }
    
    this._vehiclePosition = position;
    this.checkPolygonDetection();
  }
  
  /**
   * Check if vehicle is within any approach polygon and update turn guidance
   * This runs every time GPS position updates
   */
  private checkPolygonDetection(): void {
    if (this._vehiclePosition[0] === 0 && this._vehiclePosition[1] === 0) {
      return; // No valid position yet
    }
    
    // Detect which approach polygon (if any) contains the vehicle
    const detectedPolygon = detectApproachPolygon(this._vehiclePosition);
    
    // Check if polygon detection state has changed
    const polygonChanged = detectedPolygon?.id !== this._currentApproachPolygon?.id;
    
    if (polygonChanged) {
      runInAction(() => {
        this._currentApproachPolygon = detectedPolygon;
        this.showTurnGuide = detectedPolygon !== null;
      });
      
      if (detectedPolygon) {
        console.log(`🎯 Vehicle entered ${detectedPolygon.name} at [${this._vehiclePosition[0]}, ${this._vehiclePosition[1]}]`);
        console.log(`📊 Showing combined turns from lanes [${detectedPolygon.lanes.join(', ')}]`);
        
        // Update intersection data for this polygon
        this.updateIntersectionDataForPolygon(detectedPolygon);
      } else {
        console.log(`🚗 Vehicle exited approach polygon zones at [${this._vehiclePosition[0]}, ${this._vehiclePosition[1]}]`);
        // Keep existing intersection data but hide the guide
      }
    }
  }
  
  /**
   * Update intersection data when vehicle enters a new polygon
   */
  private async updateIntersectionDataForPolygon(approachPolygon: ApproachPolygon): Promise<void> {
    try {
      // Fetch all lanes data (if not already cached)
      const allLanesData = await MapDataService.fetchAllLanesData();
      
      // Process data for this specific polygon  
      const processedData = MapDataService.processPolygonApproachData(allLanesData, approachPolygon);
      
      runInAction(() => {
        this.intersectionData = processedData;
      });
      
      console.log(`✅ Updated turn guidance for ${approachPolygon.name}`);
      console.log(`🎯 Available turns: ${processedData.allAllowedTurns.filter(t => t.allowed).map(t => t.type).join(', ')}`);
      
    } catch (error) {
      console.error('Error updating intersection data for polygon:', error);
    }
  }
  
  /**
   * Initialize with polygon-based detection (waits for real GPS data)
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);
      
      console.log('🚀 Initializing DirectionGuide (POLYGON-BASED detection with REAL GPS)...');
      
      // Pre-fetch the lanes data so it's ready when vehicle enters polygon
      const allLanesData = await MapDataService.fetchAllLanesData();
      console.log(`📊 Pre-loaded ${allLanesData.lanes.length} lanes from intersection`);
      
      runInAction(() => {
        this.loading = false;
      });
      
      console.log('✅ Direction Guide initialized - waiting for real GPS data and polygon entry');
      
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'An unknown error occurred';
        this.loading = false;
      });
      console.error('Error initializing DirectionGuideViewModel:', error);
    }
  }
  
  /**
   * Static test method (ONLY FOR DEBUGGING - uses fixed position)
   */
  static async runTest(): Promise<void> {
    console.log('\n🧪 === POLYGON DETECTION TEST (Using fixed test position) ===');
    console.log('⚠️  This is a test method only - real app uses live GPS data');
    
    try {
      // Show polygon detection details for test position
      logPolygonDetectionDetails(CAR_POSITION);
      
      // Test the polygon approach
      const testViewModel = new DirectionGuideViewModel();
      
      // Wait for initialization
      await new Promise<void>((resolve, reject) => {
        const check = () => {
          if (!testViewModel.loading) {
            testViewModel.error ? reject(new Error(testViewModel.error)) : resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
      
      // Test polygon detection with fixed test position
      testViewModel.setVehiclePosition(CAR_POSITION);
      
      // Show results
      console.log('📊 Test Results:');
      console.log(`- Test position: [${CAR_POSITION[0]}, ${CAR_POSITION[1]}]`);
      console.log(`- Current polygon: ${testViewModel._currentApproachPolygon?.name || 'None'}`);
      console.log(`- Turn Guide Visible: ${testViewModel.showTurnGuide ? '✅' : '❌'}`);
      
      if (testViewModel.intersectionData) {
        console.log(`- Intersection: ${testViewModel.intersectionData.intersectionName}`);
        console.log(`- Lanes Combined: ${testViewModel.intersectionData.totalLanes}`);
        console.log('- Available Turns:');
        testViewModel.allowedTurns.forEach(turn => {
          console.log(`  ${turn.type}: ${turn.allowed ? '✅' : '❌'}`);
        });
      }
      
      console.log('✅ Test completed');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
    
    console.log('🧪 === END TEST ===\n');
  }
  
  /**
   * Get the current approach direction (legacy compatibility)
   */
  get approachDirection(): ApproachDirection {
    return this.intersectionData?.approachDirection || ApproachDirection.UNKNOWN;
  }
  
  /**
   * Get the current approach polygon (new)
   */
  get currentApproachPolygon(): ApproachPolygon | null {
    return this._currentApproachPolygon;
  }
  
  /**
   * Get the name of current approach polygon
   */
  get currentApproachName(): string {
    return this._currentApproachPolygon?.name || 'No approach detected';
  }
  
  /**
   * Get combined allowed turns for current approach
   */
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  /**
   * Get number of lanes for current approach
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
   * Get debug info for current state
   */
  get debugInfo(): string {
    return `GPS: ${this._hasReceivedGPSUpdate ? '✅' : '❌'} | ` +
           `Position: [${this._vehiclePosition[0].toFixed(6)}, ${this._vehiclePosition[1].toFixed(6)}] | ` +
           `Polygon: ${this._currentApproachPolygon?.name || 'None'} | ` +
           `Turns: ${this.showTurnGuide ? '✅' : '❌'}`;
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