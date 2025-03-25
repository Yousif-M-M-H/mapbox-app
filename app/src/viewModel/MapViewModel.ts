// src/viewmodels/MapViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { Coordinate, toGeoJSONCoordinate } from '../models/Location';
import { LineStringFeature, createRouteFeature, RouteStep } from '../models/Routes';
import { SearchResult } from '../models/Search';
import { LocationService } from '../services/LocationService';
import { DirectionsService } from '../services/DirectionsService';
import { SearchService } from '../services/SearchService';
import { NavigationService } from '../services/NavigationService';

export class MapViewModel {
  userLocation: Coordinate = { longitude: -85.2749, latitude: 35.0458 };
  destinationLocation: Coordinate = { longitude: -85.2972, latitude: 35.0456 };
  routeGeometry: LineStringFeature = createRouteFeature([]);
  showRoute: boolean = false;
  loading: boolean = false;
  distance: number | null = null;
  duration: number | null = null;
  isInitialized: boolean = false;
  
  // Search related state
  searchQuery: string = '';
  searchResults: SearchResult[] = [];
  selectedDestination: SearchResult | null = null;
  isSearching: boolean = false;
  
  // Navigation related state
  isNavigating: boolean = false;
  navigationSteps: RouteStep[] = [];
  currentStep: RouteStep | null = null;
  currentStepIndex: number = 0;
  distanceToNextStep: number = 0;
  isApproachingStep: boolean = false;
  locationSubscription: Location.LocationSubscription | null = null;
  rerouteCount: number = 0;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    try {
      const hasPermission = await LocationService.requestPermission();
      if (hasPermission) {
        await this.getCurrentLocation();
      } else {
        // Still mark as initialized even if permission denied
        runInAction(() => {
          this.isInitialized = true;
        });
      }
    } catch (error) {
      console.error('Initialization error:', error);
      runInAction(() => {
        this.isInitialized = true; // Mark as initialized even on error
      });
    }
  }

  async getCurrentLocation() {
    this.setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        runInAction(() => {
          this.userLocation = location;
          this.isInitialized = true; // Mark as initialized once location is fetched
        });
        
        // Only fetch directions if we have a selected destination
        if (this.selectedDestination) {
          this.fetchDirections();
        }
      } else {
        Alert.alert('Error', 'Unable to get your location.');
        runInAction(() => {
          this.isInitialized = true; // Mark as initialized even if location not found
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      runInAction(() => {
        this.isInitialized = true;
      });
    } finally {
      this.setLoading(false);
    }
  }

  async fetchDirections() {
    if (!this.selectedDestination) return;
    
    this.setLoading(true);
    try {
      const userGeoJSON = toGeoJSONCoordinate(this.userLocation);
      const destGeoJSON = this.selectedDestination.coordinates;
      
      // First try to get the route from Mapbox
      let route = await DirectionsService.fetchDirections(userGeoJSON, destGeoJSON);
      
      // If route is null, try again with a simplified approach
      if (!route) {
        console.log("Falling back to simplified route");
        route = DirectionsService.generateSimplifiedRoute(userGeoJSON, destGeoJSON);
      }
      
      // Check that we have a valid route with coordinates
      if (route && route.coordinates && route.coordinates.length > 0) {
        runInAction(() => {
          this.routeGeometry = createRouteFeature(route.coordinates);
          this.showRoute = true;
          this.distance = route.distance || null;
          this.duration = route.duration || null;
          
          // Save navigation steps if available
          this.navigationSteps = route.steps || [];
          if (this.navigationSteps.length > 0) {
            this.currentStep = this.navigationSteps[0];
            this.currentStepIndex = 0;
          }
        });
      } else {
        throw new Error('Invalid route data received');
      }
    } catch (error) {
      console.error('Error in fetchDirections:', error);
      Alert.alert('Error', 'Unable to fetch route directions. Using a simplified route instead.');
      this.generateSimplifiedRoute();
    } finally {
      this.setLoading(false);
    }
  }

  generateSimplifiedRoute() {
    if (!this.selectedDestination) return;
    
    try {
      const userGeoJSON = toGeoJSONCoordinate(this.userLocation);
      const destGeoJSON = this.selectedDestination.coordinates;
      
      const route = DirectionsService.generateSimplifiedRoute(userGeoJSON, destGeoJSON);
      
      runInAction(() => {
        this.routeGeometry = createRouteFeature(route.coordinates);
        this.showRoute = true;
        this.distance = route.distance || null;
        this.duration = route.duration || null;
        // Clear navigation steps as we don't have turn-by-turn for simplified routes
        this.navigationSteps = [];
        this.currentStep = null;
      });
    } catch (error) {
      console.error('Error generating simplified route:', error);
      
      // Last resort - create a simple direct line
      const start = toGeoJSONCoordinate(this.userLocation);
      const end = this.selectedDestination.coordinates;
      
      const simpleRoute = {
        coordinates: [start, end],
        distance: 0,
        duration: 0
      };
      
      runInAction(() => {
        this.routeGeometry = createRouteFeature(simpleRoute.coordinates);
        this.showRoute = true;
        this.distance = null;
        this.duration = null;
        this.navigationSteps = [];
        this.currentStep = null;
      });
    }
  }
  
  // Search methods
  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.performSearch();
  }
  
  async performSearch() {
    if (this.searchQuery.length < 3) {
      runInAction(() => {
        this.searchResults = [];
      });
      return;
    }
    
    this.isSearching = true;
    try {
      // Pass the user's current location to prioritize nearby places
      const results = await SearchService.searchAddress(this.searchQuery, this.userLocation);
      runInAction(() => {
        this.searchResults = results;
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      runInAction(() => {
        this.isSearching = false;
      });
    }
  }
  
  selectDestination(result: SearchResult) {
    this.selectedDestination = result;
    this.searchQuery = result.placeName;
    this.searchResults = [];
    this.fetchDirections();
  }
  
  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
  }

  // Navigation methods
  startNavigation() {
    if (!this.selectedDestination) {
      Alert.alert('Navigation Error', 'Please select a destination first');
      return;
    }
    
    if (this.navigationSteps.length === 0) {
      // If we don't have steps, still allow basic navigation
      Alert.alert('Limited Navigation', 'Turn-by-turn directions not available, but basic navigation is enabled');
    }
    
    // Set navigation mode
    runInAction(() => {
      this.isNavigating = true;
      this.currentStepIndex = 0;
      if (this.navigationSteps.length > 0) {
        this.currentStep = this.navigationSteps[0];
      }
    });
    
    // Start location tracking
    this.startLocationTracking();
  }
  
  stopNavigation() {
    runInAction(() => {
      this.isNavigating = false;
    });
    
    this.stopLocationTracking();
  }
  
  private startLocationTracking() {
    // Stop any existing subscription
    this.stopLocationTracking();
    
    // Start watching position at a reasonable frequency
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 10,  // Update every 10 meters of movement
        timeInterval: 3000    // Or at most every 3 seconds
      },
      (location) => {
        this.updateNavigationState(location);
      }
    ).then(subscription => {
      this.locationSubscription = subscription;
    }).catch(error => {
      console.error('Error starting location tracking:', error);
      Alert.alert('Navigation Error', 'Could not track your location');
      this.stopNavigation();
    });
  }
  
  private stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }
  
  private updateNavigationState(location: Location.LocationObject) {
    if (!this.isNavigating || !this.selectedDestination) return;
    
    const userCoordinate: [number, number] = [
      location.coords.longitude,
      location.coords.latitude
    ];
    
    // Update user location
    runInAction(() => {
      this.userLocation = {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude
      };
    });
    
    // Check if we've reached the destination
    if (NavigationService.hasReachedDestination(
      userCoordinate,
      this.selectedDestination.coordinates
    )) {
      runInAction(() => {
        this.isNavigating = false;
        Alert.alert('Arrived', 'You have reached your destination!');
      });
      this.stopLocationTracking();
      return;
    }
    
    // Check if we need to reroute
    if (NavigationService.isRerouteNeeded(
      userCoordinate,
      this.routeGeometry.geometry.coordinates
    )) {
      this.rerouteCount++;
      
      // Don't reroute too frequently
      if (this.rerouteCount % 3 === 0) {
        this.fetchDirections(); // Recalculate route
      }
    }
    
    // Update current navigation step
    if (this.navigationSteps.length > 0) {
      const stepInfo = NavigationService.getCurrentStep(
        this.navigationSteps,
        userCoordinate,
        this.navigationSteps.length - this.currentStepIndex
      );
      
      if (stepInfo) {
        runInAction(() => {
          this.currentStep = stepInfo.step;
          this.currentStepIndex = stepInfo.index;
          this.distanceToNextStep = stepInfo.distanceToStep;
          this.isApproachingStep = stepInfo.isApproaching;
        });
      }
    }
  }
  
  // Cleanup resources
  cleanup() {
    this.stopLocationTracking();
  }
  
  setLoading(loading: boolean) {
    this.loading = loading;
  }

  get centerCoordinate(): [number, number] {
    if (this.selectedDestination) {
      return [
        (this.userLocation.longitude + this.selectedDestination.coordinates[0]) / 2,
        (this.userLocation.latitude + this.selectedDestination.coordinates[1]) / 2
      ];
    }
    
    return [this.userLocation.longitude, this.userLocation.latitude];
  }

  get userLocationCoordinate(): [number, number] {
    return [this.userLocation.longitude, this.userLocation.latitude];
  }
  
  get destinationLocationCoordinate(): [number, number] | null {
    return this.selectedDestination ? this.selectedDestination.coordinates : null;
  }

  // Compute appropriate zoom level based on route distance
  get zoomLevel(): number {
    // Use a higher zoom level when no destination is selected
    if (!this.selectedDestination) {
      return 16;
    }
    
    // Calculate appropriate zoom level based on route distance
    if (this.distance) {
      if (this.distance < 500) return 16; // Very close
      if (this.distance < 2000) return 15; // Close
      if (this.distance < 5000) return 14; // Medium
      if (this.distance < 10000) return 13; // Far
      if (this.distance < 50000) return 11; // Very far
      return 9; // Extremely far
    }
    
    return 14; // Default zoom level for routes
  }

  // Format distance to be human readable
  get formattedDistance(): string {
    if (this.distance === null) return 'Unknown';
    
    if (this.distance < 1000) {
      return `${Math.round(this.distance)} m`;
    } else {
      return `${(this.distance / 1000).toFixed(1)} km`;
    }
  }

  // Format duration to be human readable
  get formattedDuration(): string {
    if (this.duration === null) return 'Unknown';
    
    const minutes = Math.floor(this.duration / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    } else {
      return `${minutes} min`;
    }
  }
  
  // Format distance to next maneuver
  get formattedStepDistance(): string {
    if (!this.isNavigating || !this.currentStep) return '';
    
    if (this.distanceToNextStep < 1000) {
      return `${Math.round(this.distanceToNextStep)} m`;
    } else {
      return `${(this.distanceToNextStep / 1000).toFixed(1)} km`;
    }
  }
  
  // Get remaining distance
  get remainingDistance(): number | null {
    if (!this.isNavigating || !this.distance) return null;
    
    let remainingDistance = this.distance;
    
    // Subtract completed steps
    for (let i = 0; i < this.currentStepIndex; i++) {
      if (this.navigationSteps[i] && this.navigationSteps[i].distance) {
        remainingDistance -= this.navigationSteps[i].distance;
      }
    }
    
    // Subtract portion of current step
    if (this.currentStep && this.currentStep.distance) {
      const stepPortion = 1 - (this.distanceToNextStep / this.currentStep.distance);
      remainingDistance -= this.currentStep.distance * Math.max(0, Math.min(1, stepPortion));
    }
    
    return Math.max(0, remainingDistance);
  }
  
  // Format remaining distance
  get formattedRemainingDistance(): string {
    const distance = this.remainingDistance;
    if (distance === null) return this.formattedDistance;
    
    if (distance < 1000) {
      return `${Math.round(distance)} m`;
    } else {
      return `${(distance / 1000).toFixed(1)} km`;
    }
  }
  
  // Get remaining duration
  get remainingDuration(): number | null {
    if (!this.isNavigating || !this.duration) return null;
    
    let remainingDuration = this.duration;
    
    // Subtract completed steps
    for (let i = 0; i < this.currentStepIndex; i++) {
      if (this.navigationSteps[i] && this.navigationSteps[i].duration) {
        remainingDuration -= this.navigationSteps[i].duration;
      }
    }
    
    // Subtract portion of current step
    if (this.currentStep && this.currentStep.duration && this.currentStep.distance) {
      const stepPortion = 1 - (this.distanceToNextStep / this.currentStep.distance);
      remainingDuration -= this.currentStep.duration * Math.max(0, Math.min(1, stepPortion));
    }
    
    return Math.max(0, remainingDuration);
  }
  
  // Format remaining duration
  get formattedRemainingDuration(): string {
    const duration = this.remainingDuration;
    if (duration === null) return this.formattedDuration;
    
    const minutes = Math.floor(duration / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    } else {
      return `${minutes} min`;
    }
  }
  
  get destinationTitle(): string {
    return this.selectedDestination 
      ? `Route to ${this.selectedDestination.placeName.split(',')[0]}`
      : 'Enter a destination to see route';
  }
}