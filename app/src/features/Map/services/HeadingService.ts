// Platform-specific heading tracking
// iOS: Location.watchHeadingAsync (stable)
// Android: DeviceMotion (more reliable than Location.watchHeadingAsync on Android)

import * as Location from 'expo-location';
import { DeviceMotion } from 'expo-sensors';
import { Platform } from 'react-native';

export interface HeadingData {
  heading: number;
  accuracy: number;
  timestamp: number;
  source: 'compass';
}

export type HeadingCallback = (data: HeadingData) => void;

export interface CalibrationStatus {
  isCalibrated: boolean;
  offset: number;
  quality: 'uncalibrated' | 'calibrating' | 'calibrated';
}

export class HeadingService {
  private static headingSubscription: Location.LocationSubscription | null = null;
  private static deviceMotionSubscription: { remove: () => void } | null = null;
  private static callbacks: Set<HeadingCallback> = new Set();

  private static currentHeading: HeadingData = {
    heading: 0,
    accuracy: 0,
    timestamp: Date.now(),
    source: 'compass'
  };
  private static isTracking: boolean = false;

  static async startTracking(): Promise<void> {
    if (this.isTracking) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      if (Platform.OS === 'android') {
        // Android: Use DeviceMotion for more stable heading
        DeviceMotion.setUpdateInterval(16); // ~62.5 Hz for smooth updates

        this.deviceMotionSubscription = DeviceMotion.addListener(({ rotation }) => {
          const { alpha } = rotation;

          // Calculate heading from device rotation
          let calculatedHeading = 360 - (alpha * 180 / Math.PI);
          if (calculatedHeading < 0) {
            calculatedHeading += 360;
          }
          if (calculatedHeading > 360) {
            calculatedHeading -= 360;
          }

          const data: HeadingData = {
            heading: parseFloat(calculatedHeading.toFixed(1)), // Round to 1 decimal for performance
            accuracy: 0, // DeviceMotion doesn't provide accuracy
            timestamp: Date.now(),
            source: 'compass'
          };

          this.currentHeading = data;
          this.notifyCallbacks(data);
        });

        console.log('✅ [HeadingService] Android DeviceMotion tracking started');
      } else {
        // iOS: Use Location.watchHeadingAsync (stable on iOS)
        this.headingSubscription = await Location.watchHeadingAsync((headingData) => {
          // Use trueHeading if available (true north), otherwise magHeading (magnetic north)
          const heading = headingData.trueHeading >= 0 ? headingData.trueHeading : headingData.magHeading;

          const data: HeadingData = {
            heading: Math.round(heading),
            accuracy: headingData.accuracy,
            timestamp: Date.now(),
            source: 'compass'
          };

          this.currentHeading = data;
          this.notifyCallbacks(data);

          console.log(`🧭 [HeadingService] Heading: ${data.heading}° (accuracy: ${data.accuracy})`);
        });

        console.log('✅ [HeadingService] iOS Compass tracking started');
      }

      this.isTracking = true;
    } catch (error) {
      console.error('❌ [HeadingService] Failed to start tracking:', error);
      throw error;
    }
  }

  static stopTracking(): void {
    if (this.headingSubscription) {
      this.headingSubscription.remove();
      this.headingSubscription = null;
    }
    if (this.deviceMotionSubscription) {
      this.deviceMotionSubscription.remove();
      this.deviceMotionSubscription = null;
    }
    this.isTracking = false;
    console.log('⏹️ [HeadingService] Tracking stopped');
  }

  static subscribe(callback: HeadingCallback): () => void {
    this.callbacks.add(callback);
    if (this.currentHeading.heading !== 0) {
      callback(this.currentHeading);
    }
    return () => this.callbacks.delete(callback);
  }

  static getCurrentHeading(): HeadingData {
    return { ...this.currentHeading };
  }

  static getCalibrationStatus(): CalibrationStatus {
    // With native compass API, calibration is handled by the OS
    // We report based on accuracy from the sensor
    const isCalibrated = this.currentHeading.accuracy >= 0;
    const quality: 'uncalibrated' | 'calibrating' | 'calibrated' =
      this.currentHeading.accuracy >= 0 ? 'calibrated' : 'uncalibrated';

    return {
      isCalibrated,
      offset: 0, // No manual calibration needed
      quality
    };
  }

  static getCardinalDirection(heading: number): string {
    const normalized = ((heading % 360) + 360) % 360;
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(normalized / 45) % 8;
    return directions[index];
  }

  static resetCalibration(): void {
    // Calibration is handled by the OS, nothing to reset
    console.log('🔄 [HeadingService] Using OS-managed calibration');
  }

  private static notifyCallbacks(data: HeadingData): void {
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in heading callback:', error);
      }
    });
  }

  static isCurrentlyTracking(): boolean {
    return this.isTracking;
  }

  static cleanup(): void {
    this.stopTracking();
    this.callbacks.clear();
    this.currentHeading = {
      heading: 0,
      accuracy: 0,
      timestamp: Date.now(),
      source: 'compass'
    };
  }
}
