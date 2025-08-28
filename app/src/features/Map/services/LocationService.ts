// app/src/features/Map/services/LocationService.ts
import * as Location from 'expo-location';
import { Coordinate } from '../models/Location';

export class LocationService {
  static async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  static async getCurrentLocation(): Promise<Coordinate | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      return {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
        heading: location.coords.heading !== null ? location.coords.heading : undefined
      };
    } catch (error) {
      return null;
    }
  }

  // Add method to specifically get device heading
  static async getDeviceHeading(): Promise<number> {
    try {
      // Check if heading is available
      const isAvailable = await Location.hasServicesEnabledAsync();
      if (!isAvailable) {
        return 0;
      }

      // Get heading update
      const headingData = await Location.getHeadingAsync();
      return headingData?.magHeading || 0;
    } catch (error) {
      return 0;
    }
  }

  // Add method to start watching heading updates
  static watchHeadingUpdates(callback: (heading: number) => void): { remove: () => void } {
    // Using then() to convert Promise<LocationSubscription> to LocationSubscription
    let subscription: any = null;
    Location.watchHeadingAsync(headingData => {
      callback(headingData.magHeading || 0);
    }).then(sub => {
      subscription = sub;
    });
    
    // Return a LocationSubscription object with a remove method
    return {
      remove: () => {
        if (subscription) {
          subscription.remove();
        }
      }
    };
  }
}