// app/src/features/Map/services/HeadingService.ts

import { Magnetometer, MagnetometerMeasurement } from 'expo-sensors';
import * as Location from 'expo-location';
import { Subscription } from 'expo-sensors/build/Pedometer';

export interface HeadingData {
  heading: number;
  accuracy: number;
  timestamp: number;
}

export type HeadingCallback = (data: HeadingData) => void;

export class HeadingService {
  private static magnetometerSubscription: Subscription | null = null;
  private static locationSubscription: Location.LocationSubscription | null = null;
  private static callbacks: Set<HeadingCallback> = new Set();
  private static currentHeading: HeadingData = {
    heading: 0,
    accuracy: 1,
    timestamp: Date.now()
  };
  private static isTracking: boolean = false;
  private static useMagnetometer: boolean = true;
  private static smoothingFactor: number = 0.25; // Smoothing for heading changes
  private static previousHeading: number = 0;

  /**
   * Start tracking device heading using Magnetometer (most reliable)
   */
  static async startTracking(): Promise<void> {
    if (this.isTracking) {
      return;
    }

    try {
      // Check if magnetometer is available
      const isAvailable = await Magnetometer.isAvailableAsync();

      if (isAvailable) {
        // Use magnetometer (most reliable)
        await this.startMagnetometerTracking();
      } else {
        // Fallback to location-based heading
        await this.startLocationHeadingTracking();
      }

      this.isTracking = true;
    } catch (error) {
      throw new Error(`Failed to start heading tracking: ${error}`);
    }
  }

  /**
   * Start magnetometer-based tracking (PRIMARY METHOD)
   */
  private static async startMagnetometerTracking(): Promise<void> {
    // Set update interval to 16ms for smooth 60fps updates
    Magnetometer.setUpdateInterval(16);

    this.magnetometerSubscription = Magnetometer.addListener((data: MagnetometerMeasurement) => {
      // Calculate heading from magnetometer data
      const heading = this.calculateHeadingFromMagnetometer(data);

      // Apply smoothing to prevent jitter
      const smoothedHeading = this.applySmoothingToHeading(heading);

      const headingData: HeadingData = {
        heading: smoothedHeading,
        accuracy: 1,
        timestamp: Date.now()
      };

      this.currentHeading = headingData;
      this.notifyCallbacks(headingData);
    });

    this.useMagnetometer = true;
  }

  /**
   * Calculate heading from magnetometer x, y values
   */
  private static calculateHeadingFromMagnetometer(_data: MagnetometerMeasurement): number {
    // HARDCODED FOR TESTING: Always return 210 degrees
    return 210;

    /* ORIGINAL CODE - COMMENTED OUT FOR TESTING
    const { x, y } = _data;

    // Standard magnetometer heading calculation for Android devices
    // atan2(x, y) gives the angle from magnetic north
    let angle = Math.atan2(x, y);

    // Convert to degrees
    let degrees = angle * (180 / Math.PI);

    // Normalize to 0-360 range
    if (degrees < 0) {
      degrees = 360 + degrees;
    }

    return degrees % 360;
    */
  }

  /**
   * Apply smoothing to heading to reduce jitter
   */
  private static applySmoothingToHeading(newHeading: number): number {
    // Handle the 359-0 degree wraparound
    let delta = newHeading - this.previousHeading;

    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }

    // Apply exponential smoothing
    const smoothedHeading = this.previousHeading + (delta * this.smoothingFactor);

    // Normalize to 0-360
    let normalized = smoothedHeading % 360;
    if (normalized < 0) {
      normalized += 360;
    }

    this.previousHeading = normalized;
    return Math.round(normalized);
  }

  /**
   * Fallback: Start location-based heading tracking
   */
  private static async startLocationHeadingTracking(): Promise<void> {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      throw new Error('Location permission not granted');
    }

    this.locationSubscription = await Location.watchHeadingAsync((headingData) => {
      const rawHeading = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;
      const normalizedHeading = this.normalizeHeading(rawHeading);

      const data: HeadingData = {
        heading: normalizedHeading,
        accuracy: headingData.accuracy,
        timestamp: Date.now()
      };

      this.currentHeading = data;
      this.notifyCallbacks(data);
    });

    this.useMagnetometer = false;
  }

  /**
   * Stop tracking device heading
   */
  static stopTracking(): void {
    if (this.magnetometerSubscription) {
      this.magnetometerSubscription.remove();
      this.magnetometerSubscription = null;
    }

    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
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
        // Silently handle callback errors
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
   * Get tracking method
   */
  static getTrackingMethod(): string {
    if (!this.isTracking) return 'Not tracking';
    return this.useMagnetometer ? 'Magnetometer' : 'Location API';
  }

  /**
   * Set smoothing factor (0.1 = more smooth, 1.0 = no smoothing)
   */
  static setSmoothingFactor(factor: number): void {
    this.smoothingFactor = Math.max(0.1, Math.min(1.0, factor));
  }

  /**
   * Cleanup all resources
   */
  static cleanup(): void {
    this.stopTracking();
    this.callbacks.clear();
    this.currentHeading = {
      heading: 0,
      accuracy: 1,
      timestamp: Date.now()
    };
    this.previousHeading = 0;
  }
}
