import { makeAutoObservable, runInAction } from 'mobx';
import { MapDataService } from '../services/MapDataService';
import { ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection } from '../models/DirectionTypes';
import { CAR_POSITION, MLK_INTERSECTION_POSITION } from '../constants/TestConstants';
import { determineApproachDirection, logDirectionDetails } from '../utils/DirectionUtils';

/**
 * ViewModel for the Direction Guide feature
 * Handles the business logic and state management
 */
export class DirectionGuideViewModel {
  // Observable state
  loading: boolean = false;
  error: string | null = null;
  intersectionData: ProcessedIntersectionData | null = null;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Initialize the view model with test data
   */
  async initialize(): Promise<void> {
    try {
      this.setLoading(true);
      this.setError(null);
      
      // Log direction calculation for debugging
      logDirectionDetails(CAR_POSITION, MLK_INTERSECTION_POSITION);
      
      // Calculate approach direction
      const approachDirection = determineApproachDirection(
        CAR_POSITION, 
        MLK_INTERSECTION_POSITION
      );
      
      // Fetch and process intersection data
      const rawData = await MapDataService.fetchIntersectionData();
      const processedData = MapDataService.processIntersectionData(
        rawData,
        approachDirection
      );
      
      runInAction(() => {
        this.intersectionData = processedData;
        this.loading = false;
      });
      
      // Log results
      this.logResults();
      
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
   * Get the allowed turns
   */
  get allowedTurns(): AllowedTurn[] {
    return this.intersectionData?.allowedTurns || [];
  }
  
  /**
   * Check if a turn type is allowed
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
  
  /**
   * Log the results of the direction guide calculations
   * This is used for testing without a UI
   */
  logResults(): void {
    if (!this.intersectionData) {
      console.log('No intersection data available');
      return;
    }
    
    console.log('\n====== DIRECTION GUIDE RESULTS ======');
    console.log(`Intersection: ${this.intersectionData.intersectionName} (ID: ${this.intersectionData.intersectionId})`);
    console.log(`Approach Direction: ${this.intersectionData.approachDirection}`);
    console.log('Allowed Turns:');
    
    this.intersectionData.allowedTurns.forEach(turn => {
      console.log(`  ${turn.type}: ${turn.allowed ? 'ALLOWED' : 'NOT ALLOWED'}`);
    });
    
    console.log(`Timestamp: ${this.intersectionData.timestamp}`);
    console.log('=====================================\n');
  }
  
  /**
   * Run a test of the direction guide
   * This can be called from anywhere to test the functionality
   */
  static async runTest(): Promise<void> {
    console.log('Running Direction Guide Test...');
    const viewModel = new DirectionGuideViewModel();
    await viewModel.initialize();
    console.log('Direction Guide Test Complete');
  }
}