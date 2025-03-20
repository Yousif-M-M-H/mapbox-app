import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import { Coordinate, toGeoJSONCoordinate } from '../models/Location';
import { LineStringFeature, createRouteFeature } from '../models/Routes'; 
import { LocationService } from '../services/LocationService';
import { DirectionsService } from '../services/DirectionsService';

export class MapViewModel {
  userLocation: Coordinate = { longitude: -85.2749, latitude: 35.0458 };
  destinationLocation: Coordinate = { longitude: -85.2972, latitude: 35.0456 };
  routeGeometry: LineStringFeature = createRouteFeature([]);
  showRoute: boolean = false;
  loading: boolean = false;
  distance: number | null = null;
  duration: number | null = null;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    const hasPermission = await LocationService.requestPermission();
    if (hasPermission) {
      await this.getCurrentLocation();
    } else {
      this.fetchDirections();
    }
  }

  async getCurrentLocation() {
    this.setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        runInAction(() => {
          this.userLocation = location;
        });
        this.fetchDirections();
      } else {
        Alert.alert('Error', 'Unable to get your location. Using default location instead.');
        this.fetchDirections();
      }
    } finally {
      this.setLoading(false);
    }
  }

  async fetchDirections() {
    this.setLoading(true);
    try {
      const userGeoJSON = toGeoJSONCoordinate(this.userLocation);
      const destGeoJSON = toGeoJSONCoordinate(this.destinationLocation);
      
      const route = await DirectionsService.fetchDirections(userGeoJSON, destGeoJSON);
      
      if (route) {
        runInAction(() => {
          this.routeGeometry = createRouteFeature(route.coordinates);
          this.showRoute = true;
          this.distance = route.distance || null;
          this.duration = route.duration || null;
        });
      } else {
        this.generateSimplifiedRoute();
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
    try {
      const userGeoJSON = toGeoJSONCoordinate(this.userLocation);
      const destGeoJSON = toGeoJSONCoordinate(this.destinationLocation);
      
      const route = DirectionsService.generateSimplifiedRoute(userGeoJSON, destGeoJSON);
      
      runInAction(() => {
        this.routeGeometry = createRouteFeature(route.coordinates);
        this.showRoute = true;
        this.distance = route.distance || null;
        this.duration = route.duration || null;
      });
    } catch (error) {
      console.error('Error generating simplified route:', error);
    }
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  get centerCoordinate(): [number, number] {
    return [
      (this.userLocation.longitude + this.destinationLocation.longitude) / 2,
      (this.userLocation.latitude + this.destinationLocation.latitude) / 2
    ];
  }

  get userLocationCoordinate(): [number, number] {
    return [this.userLocation.longitude, this.userLocation.latitude];
  }
  
  get destinationLocationCoordinate(): [number, number] {
    return [this.destinationLocation.longitude, this.destinationLocation.latitude];
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
}