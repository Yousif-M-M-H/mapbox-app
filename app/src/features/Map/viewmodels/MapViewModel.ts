// src/features/Map/viewmodels/MapViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import { Coordinate, toGeoJSONCoordinate } from '../models/Location';
import { LocationService } from '../services/LocationService';

export class MapViewModel {
  userLocation: Coordinate = { longitude: -85.2749, latitude: 35.0458 };
  isInitialized: boolean = false;
  loading: boolean = false;

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
        runInAction(() => {
          this.isInitialized = true;
        });
      }
    } catch (error) {
      console.error('Initialization error:', error);
      runInAction(() => {
        this.isInitialized = true;
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
          this.isInitialized = true;
        });
        return location;
      } else {
        Alert.alert('Error', 'Unable to get your location.');
        runInAction(() => {
          this.isInitialized = true;
        });
        return null;
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      runInAction(() => {
        this.isInitialized = true;
      });
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  setUserLocation(location: Coordinate) {
    this.userLocation = location;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  get userLocationCoordinate(): [number, number] {
    return toGeoJSONCoordinate(this.userLocation);
  }
  
  // Calculate appropriate zoom level based on context
  get zoomLevel(): number {
    return 20; // Default zoom level
  }
}