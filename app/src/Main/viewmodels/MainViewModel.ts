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
    
    // Keep the ViewModel linking (but won't be used for activation)
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
    
    // START APIS IMMEDIATELY ON APP LAUNCH
    this.startAPIsImmediately();
    
    this.startPedestrianMonitoring();
    this.startClosestIntersectionMonitoring();
    this.startSpatMonitoring();
  }
  
  /**
   * Start both SDSM and SPaT APIs immediately when app launches
   */
  private startAPIsImmediately(): void {
    // Start SDSM API for Georgia immediately
    if (TESTING_CONFIG.ENABLE_SDSM_API) {
      this.vehicleDisplayViewModel.setApiUrl('georgia');
      this.vehicleDisplayViewModel.start();
    }
    
    // SPaT will start automatically through startSpatMonitoring()
  }
  
  private startPedestrianMonitoring(): void {
    try {
      if (this.isTestingMode && this.testingPedestrianDetectorViewModel) {
        this.testingPedestrianDetectorViewModel.startMonitoring();
      } else if (!this.isTestingMode && this.pedestrianDetectorViewModel) {
        this.pedestrianDetectorViewModel.startMonitoring();
      }
    } catch (error) {
      // Suppressed
    }
  }
  
  /**
   * Keep polygon monitoring but it won't control API activation
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
   * Start SPaT monitoring
   */
  private startSpatMonitoring(): void {
    const startWhenReady = () => {
      if (this.userLocation.latitude !== 0 && this.userLocation.longitude !== 0) {
        // Set initial position
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
      // Suppressed
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