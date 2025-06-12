// app/src/features/DirectionGuide/viewModels/DirectionGuideViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn } from '../models/DirectionTypes';
import { ApproachPolygon, MLK_APPROACH_POLYGONS } from '../constants/ApproachPolygonConfig';
import { detectApproachPolygon } from '../utils/PolygonDetectionUtils';

export class DirectionGuideViewModel {
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  private _vehiclePosition: [number, number] = [0, 0];
  showTurnGuide: boolean = false;
  private _currentApproachPolygon: ApproachPolygon | null = null;
  private _lanesDataCache: any = null;
  private _lastDetectionTime: number = 0;
  
  constructor() {
    makeAutoObservable(this);
    this.initialize();
  }
  
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  /**
   * Update vehicle position and check for approach changes
   */
  setVehiclePosition(position: [number, number]): void {
    this._vehiclePosition = position;
    
    // Throttle detection to avoid excessive processing
    const now = Date.now();
    if (now - this._lastDetectionTime < 500) return;
    this._lastDetectionTime = now;
    
    this.checkApproachDetection();
  }
  
  /**
   * Simple approach detection - just check which polygon we're in
   */
  private checkApproachDetection(): void {
    if (this._vehiclePosition[0] === 0 && this._vehiclePosition[1] === 0) return;
    
    const detectedPolygon = detectApproachPolygon(this._vehiclePosition);
    const currentId = this._currentApproachPolygon?.id;
    const newId = detectedPolygon?.id;
    
    // Only process if approach changed
    if (currentId !== newId) {
      this.handleApproachChange(detectedPolygon);
    }
  }
  
  /**
   * Handle approach changes - keep it simple
   */
  private handleApproachChange(newPolygon: ApproachPolygon | null): void {
    const previousName = this._currentApproachPolygon?.name || 'None';
    const newName = newPolygon?.name || 'None';
    
    console.log(`🔄 Approach: "${previousName}" → "${newName}"`);
    
    runInAction(() => {
      this._currentApproachPolygon = newPolygon;
      this.showTurnGuide = newPolygon !== null;
      
      if (!newPolygon) {
        this.intersectionData = null;
      }
    });
    
    if (newPolygon) {
      console.log(`📍 Entered: ${newPolygon.name} (Lanes ${newPolygon.lanes.join(' & ')})`);
      this.loadTurnDataForApproach(newPolygon);
    } else {
      console.log(`📍 Left all approach zones`);
    }
  }
  
  /**
   * Load turn data - just what we need for display
   */
  private async loadTurnDataForApproach(polygon: ApproachPolygon): Promise<void> {
    try {
      console.log(`🔄 Loading turn data for ${polygon.name}...`);
      
      // Use cached data if available
      let lanesData = this._lanesDataCache;
      if (!lanesData) {
        console.log(`📡 Fetching intersection data...`);
        lanesData = await MapDataService.fetchAllLanesData();
        this._lanesDataCache = lanesData;
      }
      
      // Process turn data for this approach
      const processedData = MapDataService.processPolygonApproachData(lanesData, polygon);
      
      runInAction(() => {
        this.intersectionData = processedData;
        this.error = null;
      });
      
      console.log(`✅ Turn data loaded: ${this.allowedTurns.filter(t => t.allowed).map(t => t.type).join(', ')}`);
      
    } catch (error) {
      console.error(`❌ Failed to load turn data:`, error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Load failed';
        this.intersectionData = null;
      });
    }
  }
  
  /**
   * Initialize with approach polygons
   */
  async initialize(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });
      
      console.log(`🚀 DirectionGuide ready with ${MLK_APPROACH_POLYGONS.length} approaches:`);
      MLK_APPROACH_POLYGONS.forEach(polygon => {
        console.log(`   - ${polygon.name} (Lanes ${polygon.lanes.join('&')})`);
      });
      
      // Pre-cache intersection data
      this._lanesDataCache = await MapDataService.fetchAllLanesData();
      
      runInAction(() => {
        this.loading = false;
      });
      
      console.log(`✅ DirectionGuide initialized`);
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Init failed';
        this.loading = false;
      });
    }
  }
  
  // Simple getters for UI - what the driver actually needs
  get currentApproachName(): string {
    return this._currentApproachPolygon?.name || 'No approach detected';
  }
  
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  get currentLanes(): string {
    const lanes = this._currentApproachPolygon?.lanes || [];
    return lanes.length > 0 ? `Lanes ${lanes.join(' & ')}` : '';
  }
  
  get turnsAvailable(): number {
    return this.allowedTurns.filter(t => t.allowed).length;
  }
  
  /**
   * Check if specific turn is allowed
   */
  isTurnAllowed(turnType: string): boolean {
    const turn = this.allowedTurns.find(t => t.type === turnType);
    return turn?.allowed || false;
  }
  
  /**
   * Force refresh if needed
   */
  async refreshTurnData(): Promise<void> {
    this._lanesDataCache = null;
    if (this._currentApproachPolygon) {
      await this.loadTurnDataForApproach(this._currentApproachPolygon);
    }
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    console.log('🧹 DirectionGuide cleanup');
    this._lanesDataCache = null;
    runInAction(() => {
      this.showTurnGuide = false;
      this.intersectionData = null;
      this._currentApproachPolygon = null;
    });
  }
}