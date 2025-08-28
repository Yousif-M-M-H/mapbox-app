// app/src/features/SDSM/services/SDSMLatencyTracker.ts

import { SDSMFrequencyMonitor } from './SDSMFrequencyMonitor';

export interface LatencyMeasurement {
  objectId: number;
  createdAt: number;
  overlaidAt: number;
  createdAtTimestamp: string;
  overlaidAtTimestamp: string;
  latencyMs: number;
  objectType: 'vru' | 'vehicle';
}

export class SDSMLatencyTracker {
  private static instance: SDSMLatencyTracker | null = null;
  private objectCreationTimes: Map<number, { time: number; timestamp: string; type: 'vru' | 'vehicle' }> = new Map();
  private latencyMeasurements: LatencyMeasurement[] = [];
  private isLoggingEnabled: boolean = true;
  private appStartTime: number;

  private constructor() {
    this.appStartTime = performance.now();
  }

  public static getInstance(): SDSMLatencyTracker {
    if (!SDSMLatencyTracker.instance) {
      SDSMLatencyTracker.instance = new SDSMLatencyTracker();
    }
    return SDSMLatencyTracker.instance;
  }

  /**
   * Record when an SDSM object is created/received from API
   */
  public recordObjectCreation(objectId: number, objectType: 'vru' | 'vehicle'): void {
    const creationTime = performance.now();
    const timestamp = new Date().toISOString();
    
    this.objectCreationTimes.set(objectId, { 
      time: creationTime, 
      timestamp, 
      type: objectType 
    });
    
    // Record SDSM object reception in frequency monitor
    const frequencyMonitor = SDSMFrequencyMonitor.getInstance();
    frequencyMonitor.recordSDSMObjectReceived(objectId, objectType);
    
    // Removed verbose logging to reduce noise - only keeping analysis logs
  }

  /**
   * Record when an SDSM object gets overlaid in the UI
   */
  public recordObjectOverlay(objectId: number, objectType: 'vru' | 'vehicle'): void {
    const overlayTime = performance.now();
    const overlayTimestamp = new Date().toISOString();
    const creationData = this.objectCreationTimes.get(objectId);
    
    if (creationData === undefined) {
      // Removed verbose warning to reduce noise
      return;
    }

    const latencyMs = overlayTime - creationData.time;
    
    const measurement: LatencyMeasurement = {
      objectId,
      createdAt: creationData.time,
      overlaidAt: overlayTime,
      createdAtTimestamp: creationData.timestamp,
      overlaidAtTimestamp: overlayTimestamp,
      latencyMs,
      objectType: creationData.type
    };

    this.latencyMeasurements.push(measurement);
    
    // Record vehicle display in frequency monitor (only for vehicles)
    if (objectType === 'vehicle') {
      const frequencyMonitor = SDSMFrequencyMonitor.getInstance();
      frequencyMonitor.recordVehicleDisplayed(objectId);
    }
    
    // Clean up creation time entry
    this.objectCreationTimes.delete(objectId);
    
    // Removed verbose latency logs to reduce noise

    // Keep only recent measurements (last 100)
    if (this.latencyMeasurements.length > 100) {
      this.latencyMeasurements.shift();
    }
  }

  /**
   * Get all latency measurements
   */
  public getLatencyMeasurements(): LatencyMeasurement[] {
    return [...this.latencyMeasurements];
  }

  /**
   * Get average latency for all measurements
   */
  public getAverageLatency(): number {
    if (this.latencyMeasurements.length === 0) return 0;
    
    const sum = this.latencyMeasurements.reduce((acc, measurement) => acc + measurement.latencyMs, 0);
    return sum / this.latencyMeasurements.length;
  }

  /**
   * Get average latency by object type
   */
  public getAverageLatencyByType(objectType: 'vru' | 'vehicle'): number {
    const filteredMeasurements = this.latencyMeasurements.filter(m => m.objectType === objectType);
    
    if (filteredMeasurements.length === 0) return 0;
    
    const sum = filteredMeasurements.reduce((acc, measurement) => acc + measurement.latencyMs, 0);
    return sum / filteredMeasurements.length;
  }

  /**
   * Get latest latency measurement
   */
  public getLatestLatency(): LatencyMeasurement | null {
    return this.latencyMeasurements.length > 0 
      ? this.latencyMeasurements[this.latencyMeasurements.length - 1] 
      : null;
  }

  /**
   * Get latency statistics
   */
  public getLatencyStats(): {
    count: number;
    averageMs: number;
    minMs: number;
    maxMs: number;
    vehicleAverageMs: number;
    vruAverageMs: number;
  } {
    if (this.latencyMeasurements.length === 0) {
      return {
        count: 0,
        averageMs: 0,
        minMs: 0,
        maxMs: 0,
        vehicleAverageMs: 0,
        vruAverageMs: 0
      };
    }

    const latencies = this.latencyMeasurements.map(m => m.latencyMs);
    
    return {
      count: this.latencyMeasurements.length,
      averageMs: this.getAverageLatency(),
      minMs: Math.min(...latencies),
      maxMs: Math.max(...latencies),
      vehicleAverageMs: this.getAverageLatencyByType('vehicle'),
      vruAverageMs: this.getAverageLatencyByType('vru')
    };
  }

  /**
   * Start automatic latency logging to console
   */
  public startAutomaticLogging(intervalMs: number = 10000): void {
    this.isLoggingEnabled = true;
    
    // Removed initialization log to reduce noise
    
    // Set up periodic logging
    setInterval(() => {
      const stats = this.getLatencyStats();
      
      // Removed periodic latency stats to reduce noise
    }, intervalMs);
  }

  /**
   * Schedule detailed logging to occur after 5 seconds from app start
   */
  public scheduleDetailedLogging(): void {
    setTimeout(() => {
      this.logDetailedMeasurements();
    }, 5000);
  }

  /**
   * Log detailed measurements with exact timestamps
   */
  public logDetailedMeasurements(): void {
    // Removed detailed analysis report - user already has the data
  }

  /**
   * Clean up old creation times (objects that never got overlaid)
   */
  public cleanup(): void {
    const now = performance.now();
    const maxAge = 30000; // 30 seconds
    
    const keysToDelete: number[] = [];
    this.objectCreationTimes.forEach((creationData, objectId) => {
      if (now - creationData.time > maxAge) {
        keysToDelete.push(objectId);
      }
    });
    
    keysToDelete.forEach(key => {
      this.objectCreationTimes.delete(key);
    });
  }

  /**
   * Reset all measurements
   */
  public reset(): void {
    this.objectCreationTimes.clear();
    this.latencyMeasurements = [];
  }
}