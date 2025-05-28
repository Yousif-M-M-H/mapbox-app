// app/src/Main/viewmodels/MainViewModel.ts
import { makeAutoObservable } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { DriverViewModel } from '../../features/DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { DirectionGuideViewModel } from '../../features/DirectionGuide/viewModels/DirectionGuideViewModel';

// 🧪 TESTING MODE TOGGLE - Change this to switch between testing and production
const USE_TESTING_MODE = false; // Set to false for production mode

export class MainViewModel {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel | null = null;
  testingPedestrianDetectorViewModel: TestingPedestrianDetectorViewModel | null = null;
  directionGuideViewModel: DirectionGuideViewModel;
  
  // Flag to track which mode we're using
  isTestingMode: boolean = USE_TESTING_MODE;
  
  constructor() {
    console.log('MainViewModel: Constructor initializing');
    console.log(`🧪 TESTING MODE: ${USE_TESTING_MODE ? 'ENABLED (30m threshold)' : 'DISABLED (10m threshold)'}`);
    
    // Create the MapViewModel first
    this.mapViewModel = new MapViewModel();
    
    // Create the DriverViewModel with necessary provider functions
    this.driverViewModel = new DriverViewModel(
      () => this.mapViewModel.userLocationCoordinate,
      () => this.mapViewModel.getUserHeading()
    );
    
    // Create the appropriate PedestrianDetectorViewModel based on mode
    if (USE_TESTING_MODE) {
      console.log('MainViewModel: Creating TESTING PedestrianDetectorViewModel (30m threshold)');
      this.testingPedestrianDetectorViewModel = new TestingPedestrianDetectorViewModel();
    } else {
      console.log('MainViewModel: Creating PRODUCTION PedestrianDetectorViewModel (10m threshold)');
      this.pedestrianDetectorViewModel = new PedestrianDetectorViewModel();
    }
    
    // Create the DirectionGuideViewModel for turn guidance
    console.log('MainViewModel: Creating DirectionGuideViewModel');
    this.directionGuideViewModel = new DirectionGuideViewModel();
    
    makeAutoObservable(this);
    
    // Start pedestrian monitoring
    console.log('MainViewModel: Starting pedestrian monitoring');
    try {
      if (USE_TESTING_MODE && this.testingPedestrianDetectorViewModel) {
        this.testingPedestrianDetectorViewModel.startMonitoring();
        console.log('MainViewModel: TESTING monitoring started successfully');
      } else if (!USE_TESTING_MODE && this.pedestrianDetectorViewModel) {
        this.pedestrianDetectorViewModel.startMonitoring();
        console.log('MainViewModel: PRODUCTION monitoring started successfully');
      }
    } catch (error) {
      console.error('MainViewModel: Error starting monitoring:', error);
    }
  }
  
  // Getter to get the active pedestrian detector (testing or production)
  get activePedestrianDetector(): PedestrianDetectorViewModel | TestingPedestrianDetectorViewModel | null {
    if (this.isTestingMode) {
      return this.testingPedestrianDetectorViewModel;
    } else {
      return this.pedestrianDetectorViewModel;
    }
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
  
  // Helper method to check if pedestrians are crossing (works for both modes)
  hasPedestriansCrossing(): boolean {
    const activeDetector = this.activePedestrianDetector;
    return activeDetector ? activeDetector.pedestriansInCrosswalk > 0 : false;
  }
  
  // Get the number of pedestrians crossing (works for both modes)
  getPedestriansCrossingCount(): number {
    const activeDetector = this.activePedestrianDetector;
    return activeDetector ? activeDetector.pedestriansInCrosswalk : 0;
  }
  
  // Force a manual check for pedestrians (works for both modes)
  async checkForPedestrians(): Promise<number> {
    const activeDetector = this.activePedestrianDetector;
    if (!activeDetector) return 0;
    
    console.log(`MainViewModel: Manual pedestrian check requested (${this.isTestingMode ? 'TESTING' : 'PRODUCTION'} mode)`);
    
    if ('isMonitoring' in activeDetector && activeDetector.isMonitoring) {
      activeDetector.stopMonitoring();
    }
    if ('startMonitoring' in activeDetector) {
      activeDetector.startMonitoring();
    }
    
    return activeDetector.pedestriansInCrosswalk;
  }
  
  cleanup() {
    console.log('MainViewModel: Cleanup called');
    
    // Clean up the appropriate pedestrian detector
    if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
      this.testingPedestrianDetectorViewModel.cleanup();
    } else if (!this.isTestingMode && this.pedestrianDetectorViewModel) {
      this.pedestrianDetectorViewModel.cleanup();
    }
    
    // Clean up the map view model
    if (this.mapViewModel && this.mapViewModel.cleanup) {
      this.mapViewModel.cleanup();
    }
    
    console.log('MainViewModel: Cleanup complete');
  }
}