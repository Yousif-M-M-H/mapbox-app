// app/src/features/DirectionGuide/viewModels/DirectionGuideViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection } from '../models/DirectionTypes';
import { ApproachPolygon } from '../constants/ApproachPolygonConfig';
import { detectApproachPolygon } from '../utils/PolygonDetectionUtils';

export class DirectionGuideViewModel {
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  private _vehiclePosition: [number, number] = [0, 0];
  showTurnGuide: boolean = false;
  private _currentApproachPolygon: ApproachPolygon | null = null;
  private _lanesDataCache: any = null;
  
  constructor() {
    makeAutoObservable(this);
    this.initialize();
  }
  
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  /**
   * Main GPS update method
   */
  setVehiclePosition(position: [number, number]): void {
    this._vehiclePosition = position;
    this.checkPolygonDetection();
  }
  
  /**
   * Check polygon detection and update state
   */
  private checkPolygonDetection(): void {
    if (this._vehiclePosition[0] === 0 && this._vehiclePosition[1] === 0) {
      return;
    }
    
    const detectedPolygon = detectApproachPolygon(this._vehiclePosition);
    const polygonChanged = detectedPolygon?.id !== this._currentApproachPolygon?.id;
    
    if (polygonChanged) {
      runInAction(() => {
        this._currentApproachPolygon = detectedPolygon;
        this.showTurnGuide = detectedPolygon !== null;
      });
      
      if (detectedPolygon) {
        console.log(`Entered: ${detectedPolygon.name}`);
        this.loadTurnDataForPolygon(detectedPolygon);
      } else {
        runInAction(() => {
          this.intersectionData = null;
        });
      }
    }
  }
  
  /**
   * Load turn data for detected polygon
   */
  private async loadTurnDataForPolygon(polygon: ApproachPolygon): Promise<void> {
    try {
      let lanesData = this._lanesDataCache;
      if (!lanesData) {
        lanesData = await MapDataService.fetchAllLanesData();
        this._lanesDataCache = lanesData;
      }
      
      const processedData = MapDataService.processPolygonApproachData(lanesData, polygon);
      
      runInAction(() => {
        this.intersectionData = processedData;
        this.error = null;
      });
      
      console.log('Turn data loaded successfully');
      
    } catch (error) {
      console.error('Failed to load turn data:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Load failed';
        this.intersectionData = null;
      });
    }
  }
  
  /**
   * Initialize the view model
   */
  async initialize(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });
      
      this._lanesDataCache = await MapDataService.fetchAllLanesData();
      
      runInAction(() => {
        this.loading = false;
      });
      
    } catch (error) {
      console.error('Initialization failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Init failed';
        this.loading = false;
      });
    }
  }
  
  // Getters for UI
  get currentApproachPolygon(): ApproachPolygon | null {
    return this._currentApproachPolygon;
  }
  
  get currentApproachName(): string {
    return this._currentApproachPolygon?.name || 'No approach';
  }
  
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  get totalLanes(): number {
    return this.intersectionData?.totalLanes || 0;
  }
  
  get approachDirection(): ApproachDirection {
    return this.intersectionData?.approachDirection || ApproachDirection.UNKNOWN;
  }
  
  isTurnAllowed(turnType: string): boolean {
    const turn = this.allowedTurns.find(t => t.type === turnType);
    return turn?.allowed || false;
  }
  
  setLoading(loading: boolean): void {
    this.loading = loading;
  }
  
  setError(error: string | null): void {
    this.error = error;
  }
}