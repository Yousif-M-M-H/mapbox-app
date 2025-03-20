import * as Location from 'expo-location';
import { Coordinate } from '../models/Location';

export class LocationService {
  static async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<Coordinate | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      return {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }
}