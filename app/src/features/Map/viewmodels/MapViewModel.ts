// app/src/features/Map/viewmodels/MapViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import { Coordinate, toGeoJSONCoordinate } from '../models/Location';
import { LocationService } from '../services/LocationService';

// Define a type for the heading subscription
type HeadingSubscription = { remove: () => void };

export class MapViewModel {
  userLocation: Coordinate = { longitude: -85.2749, latitude: 35.0458 };
  userHeading: number = 0;
  isInitialized: boolean = false;
  loading: boolean = false;
  private headingSubscription: HeadingSubscription | null = null;

  constructor() {
    makeAutoObservable(this);
    this.init();
  }

  async init() {
    try {
      const hasPermission = await LocationService.requestPermission();
      if (hasPermission) {
        await this.getCurrentLocation();
        // Start tracking heading
        this.startHeadingTracking();
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

  // Start tracking device heading
  startHeadingTracking() {
    this.stopHeadingTracking(); // Clear any existing subscription
    
    this.headingSubscription = LocationService.watchHeadingUpdates((heading) => {
      runInAction(() => {
        this.userHeading = heading;
      });
    });
    
    // console.log('Started heading tracking');
  }
  
  // Stop tracking heading
  stopHeadingTracking() {
    if (this.headingSubscription) {
      this.headingSubscription.remove();
      this.headingSubscription = null;
      // console.log('Stopped heading tracking');
    }
  }

  async getCurrentLocation() {
    this.setLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      if (location) {
        runInAction(() => {
          this.userLocation = location;
          // Update heading if available in location
          if (location.heading !== undefined) {
            this.userHeading = location.heading;
          }
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
    // Update heading if available
    if (location.heading !== undefined) {
      this.userHeading = location.heading;
    }
  }

  // Get user heading
  getUserHeading(): number {
    return this.userHeading;
  }

  setLoading(loading: boolean) {
    this.loading = loading;
  }

  get userLocationCoordinate(): [number, number] {
    return toGeoJSONCoordinate(this.userLocation);
  }
  
  // Cleanup method to handle resources
  cleanup() {
    this.stopHeadingTracking();
  }
}