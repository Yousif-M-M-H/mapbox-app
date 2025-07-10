// app/src/Main/viewmodels/MainViewModel.ts
import { makeAutoObservable } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { PedestrianDetectorViewModel } from '../../features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { TestingVehicleDisplayViewModel } from '../../testingFeatures/testingVehicleDisplay/viewmodels/TestingVehicleDisplayViewModel';
import { DirectionGuideViewModel } from '../../features/DirectionGuide/viewModels/DirectionGuideViewModel';
import { TESTING_CONFIG } from '../../testingFeatures/TestingConfig';

// Import User Heading Feature
import { UserHeadingViewModel } from '../../features/UserHeading/viewmodels/UserHeadingViewModel';

export class MainViewModel {
  mapViewModel: MapViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel | null = null;
  testingPedestrianDetectorViewModel: TestingPedestrianDetectorViewModel | null = null;
  testingVehicleDisplayViewModel: TestingVehicleDisplayViewModel | null = null;
  directionGuideViewModel: DirectionGuideViewModel;
  userHeadingViewModel: UserHeadingViewModel; // User heading feature
  
  isTestingMode: boolean = TESTING_CONFIG.USE_TESTING_MODE;
  isVehicleTestingEnabled: boolean = TESTING_CONFIG.USE_VEHICLE_TESTING_FEATURE;
  
  constructor() {
    console.log('MainViewModel: Initializing');
    
    this.mapViewModel = new MapViewModel();
    
    // Initialize user heading feature first
    this.userHeadingViewModel = new UserHeadingViewModel();
    
    // Create appropriate pedestrian detector based on testing mode
    if (TESTING_CONFIG.USE_TESTING_MODE) {
      console.log('MainViewModel: Using TESTING mode with fixed pedestrian');
      this.testingPedestrianDetectorViewModel = new TestingPedestrianDetectorViewModel();
    } else {
      console.log('MainViewModel: Using PRODUCTION mode with API data');
      this.pedestrianDetectorViewModel = new PedestrianDetectorViewModel();
    }
    
    this.directionGuideViewModel = new DirectionGuideViewModel();
    
    if (TESTING_CONFIG.USE_VEHICLE_TESTING_FEATURE) {
      this.testingVehicleDisplayViewModel = new TestingVehicleDisplayViewModel();
    }
    
    makeAutoObservable(this);
    
    // Start pedestrian monitoring
    this.startPedestrianMonitoring();
    
    // Start user heading tracking
    this.startUserHeadingTracking();
    
    if (this.testingVehicleDisplayViewModel) {
      this.testingVehicleDisplayViewModel.start();
    }
  }
  
  private startPedestrianMonitoring(): void {
    try {
      if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
        this.testingPedestrianDetectorViewModel.startMonitoring();
      } else if (!this.isTestingMode && this.pedestrianDetectorViewModel) {
        this.pedestrianDetectorViewModel.startMonitoring();
      }
    } catch (error) {
      console.error('MainViewModel: Error starting monitoring:', error);
    }
  }
  
  // ========================================
  // User Heading Management (Fixed)
  // ========================================
  
  /**
   * Start user heading tracking with error handling
   */
  private async startUserHeadingTracking(): Promise<void> {
    try {
      console.log('🧭 Starting user heading tracking...');
      
      // Add a small delay to ensure proper initialization
      setTimeout(async () => {
        try {
          await this.userHeadingViewModel.startTracking();
        } catch (error) {
          console.error('MainViewModel: Error starting heading tracking:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('MainViewModel: Error initializing heading tracking:', error);
    }
  }
  
  /**
   * Get current user heading in degrees (with null safety)
   */
  get userHeading(): number | null {
    try {
      return this.userHeadingViewModel?.magneticHeading || null;
    } catch (error) {
      console.error('Error getting user heading:', error);
      return null;
    }
  }
  
  /**
   * Get current user direction as string (with null safety)
   */
  get userDirection(): string {
    try {
      return this.userHeadingViewModel?.compassDirection || 'Unknown';
    } catch (error) {
      console.error('Error getting user direction:', error);
      return 'Unknown';
    }
  }
  
  /**
   * Get formatted heading display string (with null safety)
   */
  get formattedUserHeading(): string {
    try {
      return this.userHeadingViewModel?.formattedHeading || 'No heading data';
    } catch (error) {
      console.error('Error getting formatted heading:', error);
      return 'Heading unavailable';
    }
  }
  
  /**
   * Check if user heading is available (with null safety)
   */
  get hasUserHeading(): boolean {
    try {
      return this.userHeadingViewModel?.hasHeading || false;
    } catch (error) {
      console.error('Error checking heading availability:', error);
      return false;
    }
  }
  
  // ========================================
  // Existing Methods (unchanged)
  // ========================================
  
  get activePedestrianDetector(): PedestrianDetectorViewModel | TestingPedestrianDetectorViewModel | null {
    return this.isTestingMode ? this.testingPedestrianDetectorViewModel : this.pedestrianDetectorViewModel;
  }
  
  get isInitialized(): boolean {
    return this.mapViewModel.isInitialized || false;
  }
  
  get loading(): boolean {
    return this.mapViewModel.loading;
  }
  
  get userLocation(): Coordinate {
    return this.mapViewModel.userLocation;
  }
  
  get userLocationCoordinate(): [number, number] {
    return this.mapViewModel.userLocationCoordinate;
  }
  
  async refreshLocation() {
    try {
      await this.mapViewModel.getCurrentLocation();
      return this.mapViewModel.userLocation;
    } catch (error) {
      console.error('MainViewModel: Failed to refresh location:', error);
      return null;
    }
  }
  
  hasPedestriansCrossing(): boolean {
    const activeDetector = this.activePedestrianDetector;
    return activeDetector ? activeDetector.pedestriansInCrosswalk > 0 : false;
  }
  
  getPedestriansCrossingCount(): number {
    const activeDetector = this.activePedestrianDetector;
    return activeDetector ? activeDetector.pedestriansInCrosswalk : 0;
  }
  
  get isVehicleTestingActive(): boolean {
    return this.isVehicleTestingEnabled && this.testingVehicleDisplayViewModel !== null;
  }
  
  async checkForPedestrians(): Promise<number> {
    const activeDetector = this.activePedestrianDetector;
    if (!activeDetector) return 0;
    
    if ('isMonitoring' in activeDetector && activeDetector.isMonitoring) {
      activeDetector.stopMonitoring();
    }
    if ('startMonitoring' in activeDetector) {
      activeDetector.startMonitoring();
    }
    
    return activeDetector.pedestriansInCrosswalk;
  }
  
  cleanup() {
    // Stop user heading tracking
    try {
      this.userHeadingViewModel?.cleanup();
    } catch (error) {
      console.error('Error cleaning up heading:', error);
    }
    
    if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
      this.testingPedestrianDetectorViewModel.cleanup();
    } else if (!this.isTestingMode && this.pedestrianDetectorViewModel) {
      this.pedestrianDetectorViewModel.cleanup();
    }
    
    if (this.testingVehicleDisplayViewModel) {
      this.testingVehicleDisplayViewModel.cleanup();
    }
    
    if (this.mapViewModel && this.mapViewModel.cleanup) {
      this.mapViewModel.cleanup();
    }
  }
}