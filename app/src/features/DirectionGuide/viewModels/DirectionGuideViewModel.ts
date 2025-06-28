// app/src/features/DirectionGuide/viewModels/DirectionGuideViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn } from '../models/DirectionTypes';
import { SpatIntegration } from '../../SpatService/SpatIntegration';
import { SignalState } from '../../SpatService/models/SpatModels';

export class DirectionGuideViewModel {
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  // SPaT status for current lanes
  spatSignalState: SignalState = SignalState.UNKNOWN;
  spatSignalGroups: number[] = [];
  spatLastUpdate: number = 0;
  spatUpdateError: string | null = null;
  
  private _vehiclePosition: [number, number] = [0, 0];
  showTurnGuide: boolean = false;
  private _lanesDataCache: any = null;
  private _lastDetectionTime: number = 0;
  private _currentLaneIds: number[] = [];
  private _spatUpdateInterval: NodeJS.Timeout | null = null;
  
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
   * Dynamic lane detection with SPaT integration
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
      
      // Detect which lanes the car is actually inside
      const detectedLanes = MapDataService.detectCarInLanes(this._vehiclePosition, lanesData);
      const hasChangedLanes = !this.arraysEqual(detectedLanes, this._currentLaneIds);
      
      if (hasChangedLanes) {
        this._currentLaneIds = detectedLanes;
        const isInAnyLane = detectedLanes.length > 0;
        
        runInAction(() => {
          this.showTurnGuide = isInAnyLane;
        });
        
        if (isInAnyLane) {
          await this.loadTurnDataForDetectedLanes();
          await this.startSpatMonitoring(); // Start continuous monitoring
        } else {
          this.stopSpatMonitoring(); // Stop monitoring when leaving lanes
          runInAction(() => {
            this.intersectionData = null;
            this.spatSignalState = SignalState.UNKNOWN;
            this.spatSignalGroups = [];
          });
        }
      }
      
    } catch (error) {
      console.error('❌ Dynamic lane detection failed:', error);
    }
  }
  
  /**
   * Start continuous SPaT monitoring while in lane
   */
  private async startSpatMonitoring(): Promise<void> {
    // Stop any existing monitoring
    this.stopSpatMonitoring();
    
    // Initial load
    await this.loadSpatDataForDetectedLanes();
    
    // Start continuous updates every 500ms (twice per second)
    this._spatUpdateInterval = setInterval(async () => {
      try {
        await this.loadSpatDataForDetectedLanes();
      } catch (error) {
        console.error('🚨 CRITICAL: SPaT update failed:', error);
        runInAction(() => {
          this.spatUpdateError = error instanceof Error ? error.message : 'SPaT update failed';
        });
      }
    }, 500); // Update every 500ms for real-time accuracy
    
    console.log('🚦 Started continuous SPaT monitoring for lanes:', this._currentLaneIds);
  }
  
  /**
   * Stop SPaT monitoring
   */
  private stopSpatMonitoring(): void {
    if (this._spatUpdateInterval) {
      clearInterval(this._spatUpdateInterval);
      this._spatUpdateInterval = null;
      console.log('🛑 Stopped SPaT monitoring');
    }
    
    runInAction(() => {
      this.spatSignalState = SignalState.UNKNOWN;
      this.spatSignalGroups = [];
      this.spatUpdateError = null;
    });
  }
  
  /**
   * Load SPaT data for currently detected lanes with enhanced error handling
   */
  private async loadSpatDataForDetectedLanes(): Promise<void> {
    const loadStartTime = Date.now();
    
    try {
      if (!this._lanesDataCache) return;
      
      // Get signal groups for detected lanes
      const signalGroups = MapDataService.getSignalGroupsForDetectedLanes(
        this._lanesDataCache, 
        this._vehiclePosition
      );
      
      if (signalGroups.length > 0) {
        // Use SPaT service to get signal state for these signal groups
        const spatViewModel = SpatIntegration.getSpatViewModel();
        
        // Get current SPaT data with timeout protection
        const fetchStartTime = Date.now();
        await spatViewModel.fetchCurrentSpatData();
        const fetchDuration = Date.now() - fetchStartTime;
        
        // Log slow API calls (potential safety issue)
        if (fetchDuration > 1000) {
          console.warn(`🚨 SLOW SPaT API: ${fetchDuration}ms - Could impact safety!`);
        }
        
        // Validate SPaT data freshness
        if (!spatViewModel.currentSpatData) {
          throw new Error('No SPaT data received from API');
        }
        
        const spatTimestamp = spatViewModel.currentSpatData.timestamp;
        const currentTime = Date.now();
        const dataAge = currentTime - spatTimestamp;
        
        // Warn if data is older than 2 seconds (safety concern)
        if (dataAge > 2000) {
          console.warn(`🚨 STALE SPaT DATA: ${dataAge}ms old - Safety risk!`);
        }
        
        // Determine signal state for our signal groups
        let signalState = SignalState.UNKNOWN;
        if (spatViewModel.currentSpatData) {
          // Check each signal group and get the most restrictive state
          const signalStates: SignalState[] = [];
          
          for (const signalGroup of signalGroups) {
            const groupSignalState = this.determineSignalStateForGroup(
              signalGroup, 
              spatViewModel.currentSpatData
            );
            signalStates.push(groupSignalState);
            
            // Log signal group status for debugging
            console.log(`🚦 Signal Group ${signalGroup}: ${groupSignalState}`);
          }
          
          // Determine final state based on priority: Red > Yellow > Green > Unknown
          if (signalStates.includes(SignalState.RED)) {
            signalState = SignalState.RED;
          } else if (signalStates.includes(SignalState.YELLOW)) {
            signalState = SignalState.YELLOW;
          } else if (signalStates.includes(SignalState.GREEN)) {
            signalState = SignalState.GREEN;
          } else {
            signalState = SignalState.UNKNOWN;
          }
          
          // Log final state for safety verification
          const loadDuration = Date.now() - loadStartTime;
          console.log(`🚦 Final SPaT State: ${signalState} (${loadDuration}ms load time)`);
        }
        
        runInAction(() => {
          this.spatSignalGroups = signalGroups;
          this.spatSignalState = signalState;
          this.spatLastUpdate = Date.now();
          this.spatUpdateError = null;
        });
      } else {
        runInAction(() => {
          this.spatSignalGroups = [];
          this.spatSignalState = SignalState.UNKNOWN;
          this.spatUpdateError = null;
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SPaT load failed';
      console.error('🚨 CRITICAL SPaT ERROR:', {
        error: errorMessage,
        lanes: this._currentLaneIds,
        position: this._vehiclePosition,
        timestamp: new Date().toISOString()
      });
      
      runInAction(() => {
        this.spatSignalState = SignalState.UNKNOWN;
        this.spatSignalGroups = [];
        this.spatUpdateError = errorMessage;
      });
    }
  }
  
  /**
   * Determine signal state for a specific signal group
   */
  private determineSignalStateForGroup(signalGroup: number, spatData: any): SignalState {
    // Check in priority order: Green > Yellow > Red > Unknown
    if (spatData.phaseStatusGroupGreens && Array.isArray(spatData.phaseStatusGroupGreens) && 
        spatData.phaseStatusGroupGreens.includes(signalGroup)) {
      return SignalState.GREEN;
    }
    
    if (spatData.phaseStatusGroupYellows && Array.isArray(spatData.phaseStatusGroupYellows) && 
        spatData.phaseStatusGroupYellows.includes(signalGroup)) {
      return SignalState.YELLOW;
    }
    
    if (spatData.phaseStatusGroupReds && Array.isArray(spatData.phaseStatusGroupReds) && 
        spatData.phaseStatusGroupReds.includes(signalGroup)) {
      return SignalState.RED;
    }
    
    return SignalState.UNKNOWN;
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
      
      // Pre-cache intersection data
      this._lanesDataCache = await MapDataService.fetchAllLanesData();
      
      runInAction(() => {
        this.loading = false;
      });
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Init failed';
        this.loading = false;
      });
    }
  }
  
  // Getters for UI
  get currentApproachName(): string {
    if (this._currentLaneIds.length === 0) return 'Not in any lane';
    
    if (this._currentLaneIds.includes(7) || this._currentLaneIds.includes(9)) {
      return 'MLK Jr Blvd approach';
    }
    
    return `Lane group containing ${this._currentLaneIds.join(' & ')}`;
  }
  
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allAllowedTurns || [];
  }
  
  get currentLanes(): string {
    if (this._currentLaneIds.length === 0) return '';
    
    if (this._currentLaneIds.length === 1) {
      return `${this._currentLaneIds[0]}`;
    } else {
      return this._currentLaneIds.join(' & ');
    }
  }
  
  get turnsAvailable(): number {
    return this.allowedTurns.filter(t => t.allowed).length;
  }
  
  get detectedLaneIds(): number[] {
    return [...this._currentLaneIds];
  }
  
  get currentIntersectionName(): string {
    return this.intersectionData?.intersectionName || 'Unknown';
  }
  
  // SPaT-related getters
  get hasSpatData(): boolean {
    return this.spatSignalGroups.length > 0 && this.spatSignalState !== SignalState.UNKNOWN;
  }
  
  get spatStatus(): { state: SignalState; signalGroups: number[] } {
    return {
      state: this.spatSignalState,
      signalGroups: this.spatSignalGroups
    };
  }
  
  get spatDataAge(): number {
    return this.spatLastUpdate > 0 ? Date.now() - this.spatLastUpdate : -1;
  }
  
  get isSpatDataStale(): boolean {
    const age = this.spatDataAge;
    return age > 3000; // Consider stale if older than 3 seconds
  }
  
  get spatMonitoringActive(): boolean {
    return this._spatUpdateInterval !== null;
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
   * Force refresh all data
   */
  async refreshAllData(): Promise<void> {
    this._lanesDataCache = null;
    await this.initialize();
    if (this.showTurnGuide) {
      await this.loadTurnDataForDetectedLanes();
      await this.loadSpatDataForDetectedLanes();
    }
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    this.stopSpatMonitoring(); // Stop SPaT monitoring
    this._lanesDataCache = null;
    this._currentLaneIds = [];
    runInAction(() => {
      this.showTurnGuide = false;
      this.intersectionData = null;
      this.spatSignalState = SignalState.UNKNOWN;
      this.spatSignalGroups = [];
      this.spatUpdateError = null;
    });
  }
}