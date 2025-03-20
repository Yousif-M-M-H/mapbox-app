import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import { Coordinate, toGeoJSONCoordinate } from '../models/Location';
import { LineStringFeature, createRouteFeature } from '../models/Routes'; 
import { LocationService } from '../services/LocationService';
import { DirectionsService } from '../services/DirectionsService';
import { SearchResult } from '../models/Search';
import { SearchService } from '../services/SearchService';

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
  
  get destinationTitle(): string {
    return this.selectedDestination 
      ? `Route to ${this.selectedDestination.placeName.split(',')[0]}`
      : 'Enter a destination to see route';
  }
}