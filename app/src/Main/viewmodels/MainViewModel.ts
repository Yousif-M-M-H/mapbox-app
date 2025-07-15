// app/src/Main/viewmodels/MainViewModel.ts
import { makeAutoObservable } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { PedestrianDetectorViewModel } from '../../features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { TestingVehicleDisplayViewModel } from '../../testingFeatures/testingVehicleDisplay/viewmodels/TestingVehicleDisplayViewModel';
import { DirectionGuideViewModel } from '../../features/DirectionGuide/viewModels/DirectionGuideViewModel';
import { TESTING_CONFIG } from '../../testingFeatures/TestingConfig';
import { DetectionZoneEntryTester } from '../../features/PedestrianDetector/testing/DetectionZoneEntryTester';

// Import User Heading Feature
import { UserHeadingViewModel } from '../../features/UserHeading/viewmodels/UserHeadingViewModel';

export class MainViewModel {
  mapViewModel: MapViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel | null = null;
  testingPedestrianDetectorViewModel: TestingPedestrianDetectorViewModel | null = null;
  testingVehicleDisplayViewModel: TestingVehicleDisplayViewModel | null = null;
  directionGuideViewModel: DirectionGuideViewModel;
  userHeadingViewModel: UserHeadingViewModel; // User heading feature
  detectionZoneEntryTester: DetectionZoneEntryTester; // Detection zone entry time testing
  
  isTestingMode: boolean = TESTING_CONFIG.USE_TESTING_MODE;
  isVehicleTestingEnabled: boolean = TESTING_CONFIG.USE_VEHICLE_TESTING_FEATURE;
  
  constructor() {
    console.log('MainViewModel: Initializing');
    
    this.mapViewModel = new MapViewModel();
    
    // Initialize user heading feature first
    this.userHeadingViewModel = new UserHeadingViewModel();
    
    // Initialize detection zone entry tester
    this.detectionZoneEntryTester = new DetectionZoneEntryTester();
    
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
    
    // Start detection zone entry testing
    this.startDetectionZoneEntryTesting();
    
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
  // Detection Zone Entry Testing
  // ========================================
  
  /**
   * Start detection zone entry time testing
   */
  private startDetectionZoneEntryTesting(): void {
    try {
      this.detectionZoneEntryTester.startTesting();
      
      // Set up periodic updates to feed data to the tester
      setInterval(() => {
        this.updateDetectionZoneEntryTester();
      }, 500); // Update every 500ms for responsive testing
      
    } catch (error) {
      console.error('MainViewModel: Error starting detection zone entry testing:', error);
    }
  }
  
  /**
   * Update the detection zone entry tester with current pedestrian data
   */
  private updateDetectionZoneEntryTester(): void {
    if (!this.detectionZoneEntryTester.isTestingActive()) {
      return;
    }
    
    const activeDetector = this.activePedestrianDetector;
    if (!activeDetector) {
      return;
    }
    
    try {
      // Get current pedestrians from the active detector
      const currentPedestrians = activeDetector.pedestrians.map(p => ({
        id: p.id,
        coordinates: p.coordinates
      }));
      
      // Get pedestrians that are currently registered (in crosswalk)
      const registeredPedestrianIds = this.getPedestriansInCrosswalkIds();
      
      // Feed data to the tester
      this.detectionZoneEntryTester.processPedestrianUpdate(
        currentPedestrians,
        registeredPedestrianIds
      );
      
    } catch (error) {
      console.error('MainViewModel: Error updating detection zone entry tester:', error);
    }
  }
  
  /**
   * Get IDs of pedestrians currently in crosswalk (considered "registered")
   */
  private getPedestriansInCrosswalkIds(): number[] {
    const activeDetector = this.activePedestrianDetector;
    if (!activeDetector) {
      return [];
    }
    
    // For the real detector, we need to check which pedestrians are in crosswalk
    if (this.pedestrianDetectorViewModel) {
      return this.pedestrianDetectorViewModel.getPedestriansInCrosswalk().map(p => p.id);
    }
    
    // For testing detector, check manually
    if (this.testingPedestrianDetectorViewModel) {
      return this.testingPedestrianDetectorViewModel.pedestrians
        .filter(p => this.isInCrosswalk(p.coordinates))
        .map(p => p.id);
    }
    
    return [];
  }
  
  /**
   * Check if coordinates are in crosswalk (helper for testing mode)
   */
  private isInCrosswalk(coordinates: [number, number]): boolean {
    // This is a simplified version - in real usage the detectors handle this
    // For testing purposes, we'll assume pedestriansInCrosswalk > 0 means registered
    return this.pedestriansInCrosswalk > 0;
  }
  
  /**
   * Get detection zone entry testing status
   */
  get isDetectionZoneTestingActive(): boolean {
    return this.detectionZoneEntryTester.isTestingActive();
  }
  
  /**
   * Stop detection zone entry testing
   */
  stopDetectionZoneEntryTesting(): void {
    this.detectionZoneEntryTester.stopTesting();
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
  
  get pedestriansInCrosswalk(): number {
    return this.getPedestriansCrossingCount();
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
    // Stop detection zone entry testing
    try {
      this.detectionZoneEntryTester?.stopTesting();
    } catch (error) {
      console.error('Error cleaning up detection zone entry tester:', error);
    }
    
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