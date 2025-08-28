// app/src/features/PedestrianDetector/services/AlertLatencyTester.ts

interface LatencyMeasurement {
  triggerTime: number;
  displayTime: number;
  latencyMs: number;
  pedestrianId: number;
  timestamp: string;
}

export class AlertLatencyTester {
  private measurements: LatencyMeasurement[] = [];
  private pendingTriggers: Map<number, number> = new Map(); // pedestrianId -> triggerTime
  private isEnabled: boolean = true;
  
  /**
   * Mark when alert conditions are triggered
   */
  markTrigger(pedestrianId: number): void {
    if (!this.isEnabled) return;
    
    const triggerTime = performance.now();
    this.pendingTriggers.set(pedestrianId, triggerTime);
    
  }
  
  /**
   * Mark when alert message is displayed in UI
   */
  markDisplay(pedestrianId: number): void {
    if (!this.isEnabled) return;
    
    const displayTime = performance.now();
    const triggerTime = this.pendingTriggers.get(pedestrianId);
    
    if (triggerTime === undefined) {
      return;
    }
    
    const latencyMs = displayTime - triggerTime;
    
    const measurement: LatencyMeasurement = {
      triggerTime,
      displayTime,
      latencyMs,
      pedestrianId,
      timestamp: new Date().toISOString()
    };
    
    this.measurements.push(measurement);
    this.pendingTriggers.delete(pedestrianId);
    
    // Log the measurement
    this.logLatencyMeasurement(measurement);
  }
  
  /**
   * Log a single latency measurement
   */
  private logLatencyMeasurement(measurement: LatencyMeasurement): void {
  }
  
  /**
   * Get summary statistics of all measurements
   */
  getSummaryStats(): {
    count: number;
    averageLatency: number;
    minLatency: number;
    maxLatency: number;
    allMeasurements: LatencyMeasurement[];
  } {
    if (this.measurements.length === 0) {
      return {
        count: 0,
        averageLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        allMeasurements: []
      };
    }
    
    const latencies = this.measurements.map(m => m.latencyMs);
    
    return {
      count: this.measurements.length,
      averageLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      minLatency: Math.min(...latencies),
      maxLatency: Math.max(...latencies),
      allMeasurements: [...this.measurements]
    };
  }
  
  /**
   * Log summary statistics to console
   */
  logSummaryStats(): void {
    const stats = this.getSummaryStats();
    
    
    if (stats.count > 0) {
      
      // Show all individual measurements
      stats.allMeasurements.forEach((measurement, index) => {
      });
    } else {
    }
    
  }
  
  /**
   * Clear all measurements and reset
   */
  reset(): void {
    this.measurements = [];
    this.pendingTriggers.clear();
  }
  
  /**
   * Enable or disable latency testing
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }
  
  /**
   * Check if there are any pending triggers (for debugging)
   */
  getPendingTriggers(): number[] {
    return Array.from(this.pendingTriggers.keys());
  }
}

// Create a singleton instance for easy use across the app
export const alertLatencyTester = new AlertLatencyTester();