// app/src/Main/viewmodels/MainViewModel.ts
import { makeAutoObservable } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { PedestrianDetectorViewModel } from '../../features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { DirectionGuideViewModel } from '../../features/DirectionGuide/viewModels/DirectionGuideViewModel';
import { TESTING_CONFIG } from '../../testingFeatures/TestingConfig';

// Import User Heading Feature
import { UserHeadingViewModel } from '../../features/UserHeading/viewmodels/UserHeadingViewModel';

// Import SDSM Vehicle Display
import { VehicleDisplayViewModel } from '../../features/SDSM/viewmodels/VehicleDisplayViewModel';


export class MainViewModel {
  mapViewModel: MapViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel | null = null;
  testingPedestrianDetectorViewModel: TestingPedestrianDetectorViewModel | null = null;
  directionGuideViewModel: DirectionGuideViewModel;
  userHeadingViewModel: UserHeadingViewModel; // User heading feature
  vehicleDisplayViewModel: VehicleDisplayViewModel; // SDSM vehicle display
  
  isTestingMode: boolean = TESTING_CONFIG.USE_TESTING_MODE;
  isVehicleTestingEnabled: boolean = TESTING_CONFIG.USE_VEHICLE_TESTING_FEATURE;
  
  constructor() {
    
    this.mapViewModel = new MapViewModel();
    
    // Initialize user heading feature first
    this.userHeadingViewModel = new UserHeadingViewModel();
    
    // Initialize SDSM vehicle display
    this.vehicleDisplayViewModel = new VehicleDisplayViewModel();
    
    // Create appropriate pedestrian detector based on testing mode
    if (TESTING_CONFIG.USE_TESTING_MODE) {
      this.testingPedestrianDetectorViewModel = new TestingPedestrianDetectorViewModel();
    } else {
      this.pedestrianDetectorViewModel = new PedestrianDetectorViewModel();
    }
    
    this.directionGuideViewModel = new DirectionGuideViewModel();
    

    makeAutoObservable(this);
    
    // Start pedestrian monitoring
    this.startPedestrianMonitoring();
    
    // Start user heading tracking
    this.startUserHeadingTracking();
    
    // Start SDSM vehicle display
    this.vehicleDisplayViewModel.start();
    
    // Start SDSM latency tracking and automatic logging
    this.startSDSMLatencyTracking();
    
    // Start SDSM frequency monitoring for 60-second analysis
    this.startSDSMFrequencyMonitoring();
    
    // Start Detection Latency Test if in testing mode
    this.startDetectionLatencyTest();
  }
  
  private startPedestrianMonitoring(): void {
    try {
      if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
        this.testingPedestrianDetectorViewModel.startMonitoring();
      } else if (!this.isTestingMode && this.pedestrianDetectorViewModel) {
        this.pedestrianDetectorViewModel.startMonitoring();
      }
    } catch (error) {
    }
  }
  
  // ========================================
  // SDSM Latency Tracking
  // ========================================
  
  /**
   * Start SDSM latency tracking and automatic logging
   */
  private startSDSMLatencyTracking(): void {
    try {
      
      // Start automatic logging every 10 seconds
      
      // Schedule detailed logging after 5 seconds from app start
      
      // Removed latency tracking initialization logs to reduce noise
      
    } catch (error) {
      // Keep error logs for debugging critical issues
    }
  }

  /**
   * Start SDSM frequency monitoring for 60-second analysis
   */
  private startSDSMFrequencyMonitoring(): void {
    try {
      
      // Start frequency monitoring with automatic analysis after 1 minute
      
      // Removed frequency monitoring initialization logs to reduce noise
      
    } catch (error) {
      // Keep error logs for debugging critical issues
    }
  }
  
  // ========================================
  // Detection Latency Test Integration
  // ========================================
  
  /**
   * Start Detection Latency Test (only in testing mode)
   */
  private startDetectionLatencyTest(): void {
    if (!this.isTestingMode || !this.testingPedestrianDetectorViewModel) {
      return;
    }
    
    try {
      
      // Monitor test completion
      const checkTestCompletion = setInterval(() => {
        if (this.testingPedestrianDetectorViewModel?.hasCompletedDetectionLatencyTest()) {
          const result = this.testingPedestrianDetectorViewModel.getDetectionLatencyResult();
          if (result !== null) {
          }
          clearInterval(checkTestCompletion);
        }
      }, 1000);
      
    } catch (error) {
    }
  }
  
  /**
   * Get detection latency test result
   */
  get detectionLatencyResult(): number | null {
    if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
      return this.testingPedestrianDetectorViewModel.getDetectionLatencyResult();
    }
    return null;
  }
  
  /**
   * Check if detection latency test has completed
   */
  get hasCompletedDetectionLatencyTest(): boolean {
    if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
      return this.testingPedestrianDetectorViewModel.hasCompletedDetectionLatencyTest();
    }
    return false;
  }
  
  // ========================================
  // User Heading Management
  // ========================================
  
  /**
   * Start user heading tracking with error handling
   */
  private async startUserHeadingTracking(): Promise<void> {
    try {
      
      // Add a small delay to ensure proper initialization
      setTimeout(async () => {
        try {
          await this.userHeadingViewModel.startTracking();
        } catch (error) {
        }
      }, 1000);
      
    } catch (error) {
    }
  }
  
  /**
   * Get current user heading in degrees (with null safety)
   */
  get userHeading(): number | null {
    try {
      return this.userHeadingViewModel?.magneticHeading || null;
    } catch (error) {
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
  
  get pedestriansInCrosswalk(): number {
    return this.getPedestriansCrossingCount();
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
    }
    
    // Stop SDSM vehicle display
    try {
      this.vehicleDisplayViewModel?.cleanup();
      // Removed cleanup log to reduce noise
    } catch (error) {
    }
    
    if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
      this.testingPedestrianDetectorViewModel.cleanup();
    } else if (!this.isTestingMode && this.pedestrianDetectorViewModel) {
      this.pedestrianDetectorViewModel.cleanup();
    }
    
    
    if (this.mapViewModel && this.mapViewModel.cleanup) {
      this.mapViewModel.cleanup();
    }
  }
}