import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import { Coordinate } from '../models/Location';
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
      } else {
        Alert.alert('Error', 'Unable to get your location.');
        runInAction(() => {
          this.isInitialized = true;
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

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  get userLocationCoordinate(): [number, number] {
    return [this.userLocation.longitude, this.userLocation.latitude];
  }
}