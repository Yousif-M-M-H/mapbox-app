// app/src/Main/viewmodels/MainViewModel.ts
import { makeAutoObservable } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { DriverViewModel } from '../../features/DriverView/models/DriverViewModel';
import { PedestrianDetectorViewModel } from '../../features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel';

export class MainViewModel {
  mapViewModel: MapViewModel;
  driverViewModel: DriverViewModel;
  pedestrianDetectorViewModel: PedestrianDetectorViewModel;  // Changed name from pedestrianViewModel
  
  constructor() {
    console.log('MainViewModel: Constructor initializing');
    
    // Create the MapViewModel first
    this.mapViewModel = new MapViewModel();
    
    // Create the DriverViewModel with necessary provider functions
    this.driverViewModel = new DriverViewModel(
      () => this.mapViewModel.userLocationCoordinate,
      () => this.mapViewModel.getUserHeading()
    );
    
    // Create the PedestrianDetectorViewModel for pedestrian detection
    console.log('MainViewModel: Creating PedestrianDetectorViewModel');
    this.pedestrianDetectorViewModel = new PedestrianDetectorViewModel();
    
    makeAutoObservable(this);
    
    // Start pedestrian monitoring
    console.log('MainViewModel: Starting pedestrian monitoring');
    try {
      this.pedestrianDetectorViewModel.startMonitoring();
      console.log('MainViewModel: Monitoring started successfully');
    } catch (error) {
      console.error('MainViewModel: Error starting monitoring:', error);
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
  
  // Helper method to check if pedestrians are crossing
  hasPedestriansCrossing(): boolean {
    return this.pedestrianDetectorViewModel.pedestriansInCrosswalk > 0;
  }
  
  // Get the number of pedestrians crossing
  getPedestriansCrossingCount(): number {
    return this.pedestrianDetectorViewModel.pedestriansInCrosswalk;
  }
  
  // Force a manual check for pedestrians
  async checkForPedestrians(): Promise<number> {
    console.log('MainViewModel: Manual pedestrian check requested');
    // This will trigger a check through the PedestrianDetectorViewModel
    if (this.pedestrianDetectorViewModel.isMonitoring) {
      this.pedestrianDetectorViewModel.stopMonitoring();
    }
    this.pedestrianDetectorViewModel.startMonitoring();
    return this.pedestrianDetectorViewModel.pedestriansInCrosswalk;
  }
  
  cleanup() {
    console.log('MainViewModel: Cleanup called');
    
    // Clean up the pedestrian detector
    if (this.pedestrianDetectorViewModel) {
      this.pedestrianDetectorViewModel.cleanup();
    }
    
    // Clean up the map view model
    if (this.mapViewModel && this.mapViewModel.cleanup) {
      this.mapViewModel.cleanup();
    }
    
    console.log('MainViewModel: Cleanup complete');
  }
}