// app/src/features/Map/services/HeadingService.ts

import * as Location from 'expo-location';

export interface HeadingData {
  heading: number;
  accuracy: number;
  timestamp: number;
}

export type HeadingCallback = (data: HeadingData) => void;

export class HeadingService {
  private static headingSubscription: Location.LocationSubscription | null = null;
  private static callbacks: Set<HeadingCallback> = new Set();
  private static currentHeading: HeadingData = {
    heading: 0,
    accuracy: 0,
    timestamp: Date.now()
  };
  private static isTracking: boolean = false;

  /**
   * Start tracking device heading using magnetometer
   */
  static async startTracking(): Promise<void> {
    if (this.isTracking) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      this.headingSubscription = await Location.watchHeadingAsync((headingData) => {
        const data: HeadingData = {
          heading: headingData.trueHeading ?? headingData.magHeading,
          accuracy: headingData.accuracy,
          timestamp: Date.now()
        };

        this.currentHeading = data;
        this.notifyCallbacks(data);
      });

      this.isTracking = true;
    } catch (error) {
      throw new Error(`Failed to start heading tracking: ${error}`);
    }
  }

  /**
   * Stop tracking device heading
   */
  static stopTracking(): void {
    if (this.headingSubscription) {
      this.headingSubscription.remove();
      this.headingSubscription = null;
    }
    this.isTracking = false;
  }

  /**
   * Subscribe to heading updates
   */
  static subscribe(callback: HeadingCallback): () => void {
    this.callbacks.add(callback);
    
    // Immediately provide current heading if available
    if (this.currentHeading.heading !== 0) {
      callback(this.currentHeading);
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Get current heading synchronously
   */
  static getCurrentHeading(): HeadingData {
    return { ...this.currentHeading };
  }

  /**
   * Get cardinal direction from heading
   */
  static getCardinalDirection(heading: number): string {
    const normalized = ((heading % 360) + 360) % 360;
    
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalized / 45) % 8;
    
    return directions[index];
  }

  /**
   * Normalize heading to 0-360 range
   */
  static normalizeHeading(heading: number): number {
    return ((heading % 360) + 360) % 360;
  }

  /**
   * Notify all subscribers
   */
  private static notifyCallbacks(data: HeadingData): void {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        // Silently handle callback errors to prevent cascade failures
      }
    });
  }

  /**
   * Check if currently tracking
   */
  static isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Cleanup all resources
   */
  static cleanup(): void {
    this.stopTracking();
    this.callbacks.clear();
    this.currentHeading = {
      heading: 0,
      accuracy: 0,
      timestamp: Date.now()
    };
  }
}