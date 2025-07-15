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
    console.log('⏱️ MessageLatencyTester: Initialized');
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
      
      console.log(`⏱️ [Test #${this.testCounter}] CONDITIONS MET at ${this.conditionMetTimestamp.toFixed(2)}ms`);
      console.log(`    📍 Vehicle: [${vehiclePosition[0].toFixed(6)}, ${vehiclePosition[1].toFixed(6)}]`);
      console.log(`    🚶 Pedestrians in crosswalk: ${pedestrianCount}`);
      console.log(`    ⏳ Waiting for UI message display...`);
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
      
      console.log(`⏱️ [Test #${this.testCounter}] MESSAGE DISPLAYED at ${messageDisplayedTimestamp.toFixed(2)}ms`);
      console.log(`    🎯 LATENCY: ${latencyMs.toFixed(2)}ms`);
      console.log(`    ✅ Alert message successfully rendered`);
      
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
      console.log(`⏱️ [Test #${this.testCounter}] MESSAGE HIDDEN - Ready for next test`);
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
    console.log('\n⏱️ MESSAGE LATENCY TEST RESULTS:');
    console.log('================================');
    console.log(`Test ID: ${metrics.testId}`);
    console.log(`Condition Met: ${new Date(Date.now() - performance.now() + metrics.conditionMetTime).toISOString()}`);
    console.log(`Message Displayed: ${new Date(Date.now() - performance.now() + metrics.messageDisplayedTime).toISOString()}`);
    console.log(`Latency: ${metrics.latencyMs.toFixed(2)}ms`);
    
    if (this.metrics.length > 1) {
      const avgLatency = this.getAverageLatency();
      console.log(`Average Latency (${this.metrics.length} tests): ${avgLatency.toFixed(2)}ms`);
    }
    console.log('================================\n');
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
    console.log('⏱️ MessageLatencyTester: Reset complete');
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.reset();
    console.log('⏱️ MessageLatencyTester: Cleaned up');
  }
}