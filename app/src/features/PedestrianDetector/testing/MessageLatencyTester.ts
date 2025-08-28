// app/src/features/PedestrianDetector/testing/MessageLatencyTester.ts

export interface MessageLatencyMetrics {
  conditionMetTime: number;
  messageDisplayedTime: number;
  latencyMs: number;
  testId: string;
  pedestrianCount: number;
  vehiclePosition: [number, number];
}

/**
 * Measures latency between pedestrian alert conditions being met 
 * and the warning message being displayed in the UI
 */
export class MessageLatencyTester {
  private conditionMetTimestamp: number | null = null;
  private isCurrentlyShowingMessage: boolean = false;
  private testCounter: number = 0;
  private metrics: MessageLatencyMetrics[] = [];
  
  constructor() {
  }
  
  /**
   * Called when pedestrian alert conditions are met
   * (pedestriansInCrosswalk > 0 AND isVehicleNearPedestrian)
   */
  onConditionsMet(pedestrianCount: number, vehiclePosition: [number, number]): void {
    // Only start new measurement if not already showing message
    if (!this.isCurrentlyShowingMessage && this.conditionMetTimestamp === null) {
      this.conditionMetTimestamp = performance.now();
      this.testCounter++;
      
    }
  }
  
  /**
   * Called when the warning message is displayed in the UI
   */
  onMessageDisplayed(): void {
    if (this.conditionMetTimestamp !== null && !this.isCurrentlyShowingMessage) {
      const messageDisplayedTimestamp = performance.now();
      const latencyMs = messageDisplayedTimestamp - this.conditionMetTimestamp;
      
      const metrics: MessageLatencyMetrics = {
        conditionMetTime: this.conditionMetTimestamp,
        messageDisplayedTime: messageDisplayedTimestamp,
        latencyMs: latencyMs,
        testId: `test_${this.testCounter}`,
        pedestrianCount: 1, // Will be updated by caller if needed
        vehiclePosition: [0, 0] // Will be updated by caller if needed
      };
      
      this.metrics.push(metrics);
      this.isCurrentlyShowingMessage = true;
      
      
      this.logLatencyResults(metrics);
      
      // Reset for next measurement
      this.conditionMetTimestamp = null;
    }
  }
  
  /**
   * Called when warning message is hidden
   */
  onMessageHidden(): void {
    if (this.isCurrentlyShowingMessage) {
      this.isCurrentlyShowingMessage = false;
    }
  }
  
  /**
   * Get current test status for debugging
   */
  getTestStatus(): {
    isWaitingForConditions: boolean;
    isWaitingForDisplay: boolean;
    isMessageCurrentlyShowing: boolean;
    totalTests: number;
  } {
    return {
      isWaitingForConditions: this.conditionMetTimestamp === null && !this.isCurrentlyShowingMessage,
      isWaitingForDisplay: this.conditionMetTimestamp !== null && !this.isCurrentlyShowingMessage,
      isMessageCurrentlyShowing: this.isCurrentlyShowingMessage,
      totalTests: this.testCounter
    };
  }
  
  /**
   * Get all collected metrics
   */
  getMetrics(): MessageLatencyMetrics[] {
    return [...this.metrics];
  }
  
  /**
   * Get average latency from all tests
   */
  getAverageLatency(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, metric) => sum + metric.latencyMs, 0);
    return total / this.metrics.length;
  }
  
  /**
   * Log detailed latency results
   */
  private logLatencyResults(metrics: MessageLatencyMetrics): void {
    
    if (this.metrics.length > 1) {
      const avgLatency = this.getAverageLatency();
    }
  }
  
  /**
   * Export results for analysis
   */
  exportResults(): string {
    const results = {
      totalTests: this.testCounter,
      averageLatency: this.getAverageLatency(),
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
    
    return JSON.stringify(results, null, 2);
  }
  
  /**
   * Reset all test data
   */
  reset(): void {
    this.conditionMetTimestamp = null;
    this.isCurrentlyShowingMessage = false;
    this.testCounter = 0;
    this.metrics = [];
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.reset();
  }
}