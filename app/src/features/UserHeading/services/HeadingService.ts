// app/src/features/UserHeading/services/HeadingService.ts

import { HeadingData, HeadingConfig, HeadingDirection } from '../models/HeadingModels';
import * as Location from 'expo-location';

export class HeadingService {
  private previousLocation: Location.LocationObject | null = null;
  private config: HeadingConfig;
  
  constructor(config: HeadingConfig) {
    this.config = config;
    console.log('🧭 HeadingService initialized');
  }
  
  /**
   * Get current heading data
   */
  async getCurrentHeading(): Promise<HeadingData | null> {
    try {
      const heading: HeadingData = {
        magneticHeading: 0,
        trueHeading: undefined,
        movementHeading: undefined,
        accuracy: 0,
        timestamp: Date.now()
      };
      
      // Get compass heading if enabled
      if (this.config.enableCompass) {
        const compassHeading = await this.getCompassHeading();
        if (compassHeading) {
          heading.magneticHeading = compassHeading.magneticHeading;
          heading.trueHeading = compassHeading.trueHeading;
          heading.accuracy = compassHeading.accuracy;
        }
      }
      
      // Get movement heading if enabled
      if (this.config.enableMovementTracking) {
        const movementHeading = await this.getMovementHeading();
        if (movementHeading !== null) {
          heading.movementHeading = movementHeading;
        }
      }
      
      return heading;
      
    } catch (error) {
      console.error('🧭 Error getting heading:', error);
      return null;
    }
  }
  
  /**
   * Get compass heading from device magnetometer
   */
  private async getCompassHeading(): Promise<{
    magneticHeading: number;
    trueHeading?: number;
    accuracy: number;
  } | null> {
    try {
      // Check if heading is available
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('🧭 Location permission not granted for heading');
        return null;
      }
      
      // Get current location with heading
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      if (location.coords.heading !== null && location.coords.heading !== undefined) {
        return {
          magneticHeading: location.coords.heading,
          trueHeading: undefined, // Could calculate true heading with magnetic declination
          accuracy: 5 // Default accuracy estimate
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('🧭 Error getting compass heading:', error);
      return null;
    }
  }
  
  /**
   * Calculate movement heading based on GPS track
   */
  private async getMovementHeading(): Promise<number | null> {
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation
      });
      
      if (!this.previousLocation) {
        this.previousLocation = currentLocation;
        return null;
      }
      
      // Calculate bearing between previous and current location
      const bearing = this.calculateBearing(
        this.previousLocation.coords.latitude,
        this.previousLocation.coords.longitude,
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
      
      this.previousLocation = currentLocation;
      return bearing;
      
    } catch (error) {
      console.error('🧭 Error calculating movement heading:', error);
      return null;
    }
  }
  
  /**
   * Calculate bearing between two GPS points
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRadians = (degrees: number) => degrees * (Math.PI / 180);
    const toDegrees = (radians: number) => radians * (180 / Math.PI);
    
    const dLon = toRadians(lon2 - lon1);
    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - 
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    let bearing = toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360; // Normalize to 0-360
  }
  
  /**
   * Convert heading degrees to compass direction
   */
  static getCompassDirection(heading: number): HeadingDirection {
    const directions = [
      HeadingDirection.NORTH,      // 0-22.5, 337.5-360
      HeadingDirection.NORTHEAST,  // 22.5-67.5
      HeadingDirection.EAST,       // 67.5-112.5
      HeadingDirection.SOUTHEAST,  // 112.5-157.5
      HeadingDirection.SOUTH,      // 157.5-202.5
      HeadingDirection.SOUTHWEST,  // 202.5-247.5
      HeadingDirection.WEST,       // 247.5-292.5
      HeadingDirection.NORTHWEST   // 292.5-337.5
    ];
    
    const normalizedHeading = (heading + 22.5) % 360;
    const index = Math.floor(normalizedHeading / 45);
    return directions[index];
  }
  
  /**
   * Apply smoothing to heading value
   */
  static smoothHeading(currentHeading: number, previousHeading: number, smoothingFactor: number): number {
    // Handle angle wrap-around (e.g., 359° to 1°)
    let diff = currentHeading - previousHeading;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const smoothedDiff = diff * smoothingFactor;
    return (previousHeading + smoothedDiff + 360) % 360;
  }
}