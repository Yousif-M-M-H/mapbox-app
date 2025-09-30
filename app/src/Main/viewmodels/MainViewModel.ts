// app/src/Main/viewmodels/MainViewModel.ts

import { makeAutoObservable } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { PedestrianDetectorViewModel } from '../../features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel';
import { TestingPedestrianDetectorViewModel } from '../../testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel';
import { DirectionGuideViewModel } from '../../features/DirectionGuide/viewModels/DirectionGuideViewModel';
import { TESTING_CONFIG } from '../../testingFeatures/TestingConfig';

import { VehicleDisplayViewModel } from '../../features/SDSM/viewmodels/VehicleDisplayViewModel';
import { ClosestIntersectionViewModel } from '../../features/ClosestIntersection/viewmodels/ClosestIntersectionViewModel';
import { LanesViewModel } from '../../features/Lanes';
import { SpatViewModel } from '../../features/SpatService/viewModels/SpatViewModel';

export class MainViewModel {
  mapViewModel: MapViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel | null = null;
  testingPedestrianDetectorViewModel: TestingPedestrianDetectorViewModel | null = null;
  directionGuideViewModel: DirectionGuideViewModel;
  vehicleDisplayViewModel: VehicleDisplayViewModel;
  
  closestIntersectionViewModel: ClosestIntersectionViewModel;
  lanesViewModel: LanesViewModel;
  spatViewModel: SpatViewModel;
  
  isTestingMode: boolean = TESTING_CONFIG.USE_TESTING_MODE;
  isVehicleTestingEnabled: boolean = TESTING_CONFIG.USE_VEHICLE_TESTING_FEATURE;
  
  constructor() {
    this.mapViewModel = new MapViewModel();
    
    this.vehicleDisplayViewModel = new VehicleDisplayViewModel();
    
    this.closestIntersectionViewModel = new ClosestIntersectionViewModel();
    this.lanesViewModel = new LanesViewModel();

    this.spatViewModel = new SpatViewModel();
    
    // IMPORTANT: Link the ViewModels for integration
    this.closestIntersectionViewModel.setViewModels(
      this.vehicleDisplayViewModel,
      this.spatViewModel
    );
    
    // Create appropriate pedestrian detector based on testing mode
    if (TESTING_CONFIG.USE_TESTING_MODE) {
      this.testingPedestrianDetectorViewModel = new TestingPedestrianDetectorViewModel();
    } else {
      this.pedestrianDetectorViewModel = new PedestrianDetectorViewModel();
    }

    if (TESTING_CONFIG.SHOW_FIXED_PEDESTRIAN && !this.testingPedestrianDetectorViewModel) {
      this.testingPedestrianDetectorViewModel = new TestingPedestrianDetectorViewModel();
    }
    
    this.directionGuideViewModel = new DirectionGuideViewModel();
    
    makeAutoObservable(this);
    
    this.startPedestrianMonitoring();
    this.startClosestIntersectionMonitoring();
    this.startSpatMonitoring();
    this.startSDSMLatencyTracking();
    this.startSDSMFrequencyMonitoring();
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
      // Suppressed to reduce noise
    }
  }
  
  /**
   * Start polygon-based intersection monitoring with automatic API calls
   */
  private startClosestIntersectionMonitoring(): void {
    const getUserLocation = (): [number, number] => {
      return [this.userLocation.latitude, this.userLocation.longitude];
    };
    
    const startWhenReady = () => {
      if (this.userLocation.latitude !== 0 && this.userLocation.longitude !== 0) {
        this.closestIntersectionViewModel.startMonitoring(getUserLocation);
      } else {
        setTimeout(startWhenReady, 2000);
      }
    };
    
    startWhenReady();
  }

  /**
   * Start SPaT monitoring - SIMPLIFIED
   */
  private startSpatMonitoring(): void {
    const startWhenReady = () => {
      if (this.userLocation.latitude !== 0 && this.userLocation.longitude !== 0) {
        // Set initial position as [lat, lng]
        this.spatViewModel.setUserPosition([
          this.userLocation.latitude, 
          this.userLocation.longitude
        ]);
        
        // Start monitoring
        this.spatViewModel.startMonitoring();

        // Update position every 1 second
        setInterval(() => {
          if (this.userLocation.latitude !== 0 && this.userLocation.longitude !== 0) {
            this.spatViewModel.setUserPosition([
              this.userLocation.latitude, 
              this.userLocation.longitude
            ]);
          }
        }, 1000);
      } else {
        // Wait for location
        setTimeout(startWhenReady, 2000);
      }
    };

    startWhenReady();
  }
  
  /**
   * Start SDSM latency tracking and automatic logging
   */
  private startSDSMLatencyTracking(): void {
    try {
      // Silent initialization
    } catch (error) {
      // Keep error logs for debugging critical issues
    }
  }

  /**
   * Start SDSM frequency monitoring for 60-second analysis
   */
  private startSDSMFrequencyMonitoring(): void {
    try {
      // Silent initialization
    } catch (error) {
      // Keep error logs for debugging critical issues
    }
  }
  
  /**
   * Start Detection Latency Test (only in testing mode)
   */
  private startDetectionLatencyTest(): void {
    if (!this.isTestingMode || !this.testingPedestrianDetectorViewModel) {
      return;
    }
    
    try {
      const checkTestCompletion = setInterval(() => {
        if (this.testingPedestrianDetectorViewModel?.hasCompletedDetectionLatencyTest()) {
          const result = this.testingPedestrianDetectorViewModel.getDetectionLatencyResult();
          if (result !== null) {
            // Could be logged or processed further
          }
          clearInterval(checkTestCompletion);
        }
      }, 1000);
    } catch (error) {
      // Suppressed to reduce noise
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
    try {
      this.vehicleDisplayViewModel?.cleanup();
    } catch (error) {
      // Suppressed to reduce noise
    }
    
    this.closestIntersectionViewModel.cleanup();
    this.spatViewModel.cleanup();
    
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