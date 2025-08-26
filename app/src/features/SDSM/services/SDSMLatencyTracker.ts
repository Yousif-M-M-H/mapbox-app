// app/src/features/SDSM/services/SDSMLatencyTracker.ts

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
    
    // Log SDSM object creation for latency measurement tracking
    // This helps debug when objects are first received from the SDSM API
    if (this.isLoggingEnabled) {
      console.log(`📍 SDSM Object Created - ID: ${objectId}, Type: ${objectType}, Time: ${creationTime.toFixed(2)}ms, Timestamp: ${timestamp}`);
    }
  }

  /**
   * Record when an SDSM object gets overlaid in the UI
   */
  public recordObjectOverlay(objectId: number, objectType: 'vru' | 'vehicle'): void {
    const overlayTime = performance.now();
    const overlayTimestamp = new Date().toISOString();
    const creationData = this.objectCreationTimes.get(objectId);
    
    if (creationData === undefined) {
      // Warn when attempting to measure latency for an object without recorded creation time
      // This indicates a timing issue in the object lifecycle tracking
      if (this.isLoggingEnabled) {
        console.warn(`⚠️  SDSM Object Overlay - No creation time found for ID: ${objectId}`);
      }
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
    
    // Clean up creation time entry
    this.objectCreationTimes.delete(objectId);
    
    // Log successful latency measurement from SDSM object creation to UI overlay
    // Critical for performance monitoring and identifying rendering bottlenecks
    if (this.isLoggingEnabled) {
      console.log(`🎯 SDSM Latency Measured - ID: ${objectId}, Type: ${objectType}, Latency: ${latencyMs.toFixed(2)}ms`);
      console.log(`   Created: ${creationData.timestamp}`);
      console.log(`   Overlaid: ${overlayTimestamp}`);
    }

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
    
    // Log initial message to confirm latency tracking initialization
    // Helps verify that performance monitoring is active
    console.log('🚀 SDSM Latency Tracking Started - Automatic logging every 10 seconds');
    
    // Set up periodic logging
    setInterval(() => {
      const stats = this.getLatencyStats();
      
      // Periodic logging of SDSM latency statistics for ongoing performance monitoring
      // Provides real-time insights into system responsiveness and object rendering speed
      if (stats.count > 0) {
        console.log('📊 SDSM Latency Stats:', {
          'Total Measurements': stats.count,
          'Average Latency': `${stats.averageMs.toFixed(2)}ms`,
          'Min Latency': `${stats.minMs.toFixed(2)}ms`,
          'Max Latency': `${stats.maxMs.toFixed(2)}ms`,
          'Vehicle Average': `${stats.vehicleAverageMs.toFixed(2)}ms`,
          'VRU Average': `${stats.vruAverageMs.toFixed(2)}ms`
        });
      } else {
        console.log('📊 SDSM Latency Stats: No measurements yet');
      }
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
    // Generate comprehensive SDSM latency report for detailed performance analysis
    // Essential for identifying performance bottlenecks and system optimization
    console.log('\n' + '='.repeat(80));
    console.log('📊 DETAILED SDSM LATENCY REPORT (5 seconds after app start)');
    console.log('='.repeat(80));
    
    if (this.latencyMeasurements.length === 0) {
      // Log diagnostic information when no SDSM objects have been processed
      // Helps identify potential issues with data flow or system connectivity
      console.log('📝 No SDSM objects have been processed yet.');
      console.log('   This could be due to:');
      console.log('   • No objects detected in the SDSM API');
      console.log('   • Network connectivity issues');
      console.log('   • Objects not yet reaching the UI overlay stage');
      console.log('='.repeat(80) + '\n');
      return;
    }

    // Display total count of processed SDSM objects for performance assessment
    console.log(`📈 Total Objects Processed: ${this.latencyMeasurements.length}`);
    console.log('');

    // Group measurements by type
    const vehicleMeasurements = this.latencyMeasurements.filter(m => m.objectType === 'vehicle');
    const vruMeasurements = this.latencyMeasurements.filter(m => m.objectType === 'vru');

    // Log detailed measurements for the most recent SDSM objects (last 10)
    // Provides granular timing information for debugging specific latency issues
    this.latencyMeasurements.slice(-10).forEach((measurement, index) => {
      console.log(`📍 Object #${index + 1}:`);
      console.log(`   🆔 ID: ${measurement.objectId} (${measurement.objectType.toUpperCase()})`);
      console.log(`   🕐 API Timestamp:     ${measurement.createdAtTimestamp}`);
      console.log(`   🖥️  UI Overlay Timestamp: ${measurement.overlaidAtTimestamp}`);
      console.log(`   ⏱️  Latency: ${measurement.latencyMs.toFixed(2)}ms`);
      console.log('');
    });

    // Display comprehensive SDSM latency statistics broken down by object type
    // Critical for understanding performance characteristics of different SDSM object types
    const stats = this.getLatencyStats();
    console.log('📊 SUMMARY STATISTICS:');
    console.log(`   🚗 Vehicles: ${vehicleMeasurements.length} objects, avg: ${stats.vehicleAverageMs.toFixed(2)}ms`);
    console.log(`   🚶 VRUs: ${vruMeasurements.length} objects, avg: ${stats.vruAverageMs.toFixed(2)}ms`);
    console.log(`   📈 Overall Average: ${stats.averageMs.toFixed(2)}ms`);
    console.log(`   📉 Min Latency: ${stats.minMs.toFixed(2)}ms`);
    console.log(`   📈 Max Latency: ${stats.maxMs.toFixed(2)}ms`);
    
    console.log('='.repeat(80) + '\n');
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