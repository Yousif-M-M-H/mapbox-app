// app/src/features/DirectionGuide/viewModels/DirectionGuideViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn } from '../models/DirectionTypes';

export class DirectionGuideViewModel {
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  private _vehiclePosition: [number, number] = [0, 0];
  showTurnGuide: boolean = false;
  private _lanesDataCache: any = null;
  private _lastDetectionTime: number = 0;
  private _currentLaneIds: number[] = [];
  
  constructor() {
    makeAutoObservable(this);
    this.initialize();
  }
  
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  /**
   * Update vehicle position and check for dynamic lane detection
   */
  setVehiclePosition(position: [number, number]): void {
    this._vehiclePosition = position;
    
    // Throttle detection to avoid excessive processing
    const now = Date.now();
    if (now - this._lastDetectionTime < 500) return; // Check every 500ms
    this._lastDetectionTime = now;
    
    this.checkDynamicLaneDetection();
  }
  
  /**
   * Dynamic lane detection - works for any intersection without hardcoding
   */
  private async checkDynamicLaneDetection(): Promise<void> {
    if (this._vehiclePosition[0] === 0 && this._vehiclePosition[1] === 0) return;
    
    try {
      // Get intersection data (cached or fresh)
      let lanesData = this._lanesDataCache;
      if (!lanesData) {
        lanesData = await MapDataService.fetchAllLanesData();
        this._lanesDataCache = lanesData;
      }
      
      // Detect which lanes the car is actually inside (dynamic for any intersection)
      const detectedLanes = MapDataService.detectCarInLanes(this._vehiclePosition, lanesData);
      const hasChangedLanes = !this.arraysEqual(detectedLanes, this._currentLaneIds);
      
      if (hasChangedLanes) {
        this._currentLaneIds = detectedLanes;
        const isInAnyLane = detectedLanes.length > 0;
        
        runInAction(() => {
          this.showTurnGuide = isInAnyLane;
        });
        
        if (isInAnyLane) {
          this.loadTurnDataForDetectedLanes();
        } else {
          runInAction(() => {
            this.intersectionData = null;
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Dynamic lane detection failed:', error);
    }
  }
  
  /**
   * Helper to compare arrays
   */
  private arraysEqual(a: number[], b: number[]): boolean {
    return a.length === b.length && a.every((val, i) => val === b[i]);
  }
  
  /**
   * Load turn data for currently detected lanes
   */
  private async loadTurnDataForDetectedLanes(): Promise<void> {
    try {
      // Use cached data
      let lanesData = this._lanesDataCache;
      if (!lanesData) {
        lanesData = await MapDataService.fetchAllLanesData();
        this._lanesDataCache = lanesData;
      }
      
      // Get turn data for detected lanes
      const processedData = MapDataService.processCarPositionData(lanesData, this._vehiclePosition);
      
      runInAction(() => {
        this.intersectionData = processedData;
        this.error = null;
      });
      
    } catch (error) {
      console.error('❌ Failed to load turn data:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Load failed';
        this.intersectionData = null;
      });
    }
  }
  
  /**
   * Initialize with dynamic data loading
   */
  async initialize(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });
      
      // Pre-cache intersection data (will work for any intersection from API)
      this._lanesDataCache = await MapDataService.fetchAllLanesData();
      
      runInAction(() => {
        this.loading = false;
      });
      
      console.log('✅ DirectionGuide initialized with dynamic lane detection');
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Init failed';
        this.loading = false;
      });
    }
  }
  
  // Getters for UI (dynamic - shows lane group information)
  get currentApproachName(): string {
    if (this._currentLaneIds.length === 0) return 'Not in any lane';
    
    // Since we now show combined turns for the road, describe it appropriately
    if (this._currentLaneIds.includes(7) || this._currentLaneIds.includes(9)) {
      return 'MLK Jr Blvd approach';
    }
    
    // For future intersections, this would be determined dynamically
    return `Lane group containing ${this._currentLaneIds.join(' & ')}`;
  }
  
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  get currentLanes(): string {
    if (this._currentLaneIds.length === 0) return '';
    
    // Show the detected lane(s), but user sees combined turns for the road
    if (this._currentLaneIds.length === 1) {
      return `${this._currentLaneIds[0]}`;
    } else {
      return this._currentLaneIds.join(' & ');
    }
  }
  
  get turnsAvailable(): number {
    return this.allowedTurns.filter(t => t.allowed).length;
  }
  
  /**
   * Get current detected lane IDs
   */
  get detectedLaneIds(): number[] {
    return [...this._currentLaneIds];
  }
  
  /**
   * Get current intersection name (dynamic)
   */
  get currentIntersectionName(): string {
    return this.intersectionData?.intersectionName || 'Unknown';
  }
  
  /**
   * Check if car is currently in a specific lane
   */
  isInLane(laneId: number): boolean {
    return this._currentLaneIds.includes(laneId);
  }
  
  /**
   * Check if specific turn is allowed
   */
  isTurnAllowed(turnType: string): boolean {
    const turn = this.allowedTurns.find(t => t.type === turnType);
    return turn?.allowed || false;
  }
  
  /**
   * Force refresh turn data (works for any intersection)
   */
  async refreshTurnData(): Promise<void> {
    this._lanesDataCache = null;
    await this.initialize();
    if (this.showTurnGuide) {
      await this.loadTurnDataForDetectedLanes();
    }
  }
  
  /**
   * Debug method - test dynamic lane group detection at any position
   */
  public async debugLaneDetection(testPosition?: [number, number]): Promise<void> {
    const position = testPosition || this._vehiclePosition;
    
    try {
      // Get current intersection data
      const lanesData = this._lanesDataCache || await MapDataService.fetchAllLanesData();
      
      console.log(`🐛 === LANE GROUP DEBUG ===`);
      console.log(`🐛 Testing at position: [${position[0].toFixed(6)}, ${position[1].toFixed(6)}]`);
      
      // Test dynamic lane group detection
      MapDataService.debugLaneDetection(position, lanesData);
      
      console.log(`🐛 === CURRENT STATE ===`);
      console.log(`🐛 Detected lanes: ${this._currentLaneIds.join(', ') || 'NONE'}`);
      console.log(`🐛 Show turn guide: ${this.showTurnGuide ? 'YES' : 'NO'}`);
      console.log(`🐛 Available turns: ${this.allowedTurns.filter(t => t.allowed).map(t => t.type).join(', ') || 'NONE'}`);
      
    } catch (error) {
      console.error('🐛 Debug test failed:', error);
    }
  }
  
  /**
   * Set new intersection data (for when switching intersections)
   */
  async setIntersectionData(newIntersectionData: any): Promise<void> {
    this._lanesDataCache = newIntersectionData;
    this._currentLaneIds = [];
    
    runInAction(() => {
      this.showTurnGuide = false;
      this.intersectionData = null;
    });
    
    // Immediately check for lane detection with new intersection
    await this.checkDynamicLaneDetection();
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    this._lanesDataCache = null;
    this._currentLaneIds = [];
    runInAction(() => {
      this.showTurnGuide = false;
      this.intersectionData = null;
    });
  }
}