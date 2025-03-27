// src/core/coordinator/AppCoordinator.ts
import { makeAutoObservable, reaction } from 'mobx';
import { Alert } from 'react-native';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { SearchViewModel } from '../../features/Search/viewmodels/SearchViewModel';
import { RouteViewModel } from '../../features/Route/viewmodels/RouteViewModel';
import { NavigationViewModel } from '../../features/Navigation/viewmodels/NavigationViewModel';
import { Coordinate, toGeoJSONCoordinate } from '../../features/Map/models/Location';
import { LocationService } from '../../features/Map/services/LocationService';

/**
 * AppCoordinator orchestrates communication between different ViewModels
 * and handles initialization of the app
 */
export class AppCoordinator {
  isInitialized: boolean = false;
  loading: boolean = false;
  
  // ViewModels
  readonly mapViewModel: MapViewModel;
  readonly searchViewModel: SearchViewModel;
  readonly routeViewModel: RouteViewModel;
  readonly navigationViewModel: NavigationViewModel;
  
  constructor() {
    // Create the ViewModels with appropriate dependencies
    this.mapViewModel = new MapViewModel();
    
    this.searchViewModel = new SearchViewModel(
      () => this.mapViewModel.userLocation
    );
    
    this.routeViewModel = new RouteViewModel(
      () => this.mapViewModel.userLocationCoordinate,
      () => this.searchViewModel.destinationCoordinates,
      (route) => this.navigationViewModel.updateWithRoute(route)
    );
    
    this.navigationViewModel = new NavigationViewModel(
      () => this.mapViewModel.userLocationCoordinate,
      () => this.searchViewModel.destinationCoordinates,
      () => this.routeViewModel.routeGeometry.geometry.coordinates,
      () => this.routeViewModel.calculateRoute()
    );
    
    makeAutoObservable(this);
    
    // Set up reactions for coordination between ViewModels
    this.setupReactions();
    
    // Initialize the app
    this.init();
  }
  
  private setupReactions() {
    // When destination changes, calculate a new route
    reaction(
      () => this.searchViewModel.selectedDestination,
      (destination) => {
        if (destination) {
          this.routeViewModel.calculateRoute();
        } else {
          this.routeViewModel.clearRoute();
        }
      }
    );
    
    // When user location changes during navigation, update the navigation state
    reaction(
      () => this.mapViewModel.userLocation,
      () => {
        if (this.navigationViewModel.isNavigating) {
          // The navigation VM will handle updates through its location tracking
          // But we might want to add additional coordination here
        }
      }
    );
  }
  
  async init() {
    this.setLoading(true);
    try {
      const hasPermission = await LocationService.requestPermission();
      if (hasPermission) {
        await this.getCurrentLocation();
      } else {
        // Still mark as initialized even if permission denied
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Initialization error:', error);
      this.isInitialized = true; // Mark as initialized even on error
    } finally {
      this.setLoading(false);
    }
  }
  
  async getCurrentLocation() {
    this.setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        // Update the MapViewModel with the user's current location
        this.mapViewModel.setUserLocation(location);
        this.isInitialized = true;
      } else {
        Alert.alert('Error', 'Unable to get your location.');
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      this.isInitialized = true;
    } finally {
      this.setLoading(false);
    }
  }
  
  setLoading(loading: boolean) {
    this.loading = loading;
  }
  
  // Helper method for the view
  get destinationTitle(): string {
    return this.searchViewModel.hasSelectedDestination 
      ? `Route to ${this.searchViewModel.destinationName}`
      : 'Enter a destination to see route';
  }
  
  // Cleanup method to be called when the app is about to be destroyed
  cleanup() {
    this.navigationViewModel.cleanup();
  }
}