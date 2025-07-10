// app/src/features/PedestrianDetector/services/WarmOperationTester.ts

import { WarmOperationMetrics, WarmOperationSummary } from '../models/WarmOperationModels';
import { CrosswalkDetectionService } from './CrosswalkDetectionService';
import { ProximityDetectionService } from './ProximityDetectionService';

export class WarmOperationTester {
  private warmCycles: WarmOperationMetrics[] = [];
  private cycleCount: number = 0;
  private isRunning: boolean = false;
  
  constructor() {
    console.log('🔥 Warm Operation Tester initialized');
  }
  
  /**
   * Start measuring warm operation cycles
   */
  async startWarmOperationMeasurement(numberOfCycles: number = 5): Promise<WarmOperationSummary> {
    if (this.isRunning) {
      throw new Error('Warm operation measurement already running');
    }
    
    console.log(`🔥 Starting Warm Operation Measurement (${numberOfCycles} cycles)...`);
    this.isRunning = true;
    this.warmCycles = [];
    this.cycleCount = 0;
    
    try {
      // Run multiple warm detection cycles
      for (let i = 1; i <= numberOfCycles; i++) {
        console.log(`\n   🔄 Running warm cycle ${i}/${numberOfCycles}...`);
        
        const metrics = await this.measureSingleWarmCycle(i);
        this.warmCycles.push(metrics);
        
        // Wait between cycles to simulate real-world operation
        if (i < numberOfCycles) {
          await this.wait(1500); // 1.5 second interval like real monitoring
        }
      }
      
      const summary = this.calculateSummary();
      this.logWarmOperationResults(summary);
      
      return summary;
      
    } finally {
      this.isRunning = false;
    }
  }
  
  /**
   * Measure a single warm detection cycle
   */
  private async measureSingleWarmCycle(cycleNumber: number): Promise<WarmOperationMetrics> {
    const cycleStartTime = performance.now();
    
    try {
      // Step 1: API Call (warm - connections should be established)
      const apiStartTime = performance.now();
      const rawData = await this.performAPICall();
      const apiEndTime = performance.now();
      const apiCallTime = apiEndTime - apiStartTime;
      
      // Step 2: Data Processing (warm - parsing optimizations active)
      const processingStartTime = performance.now();
      const { pedestrians, pedestriansInCrosswalk, nearbyPedestrians } = this.performProcessing(rawData);
      const processingEndTime = performance.now();
      const processingTime = processingEndTime - processingStartTime;
      
      // Step 3: State Update (warm - state management optimized)
      const stateStartTime = performance.now();
      this.performStateUpdate(pedestrians, pedestriansInCrosswalk, nearbyPedestrians);
      const stateEndTime = performance.now();
      const stateUpdateTime = stateEndTime - stateStartTime;
      
      // Calculate total cycle time
      const totalCycleTime = performance.now() - cycleStartTime;
      
      const metrics: WarmOperationMetrics = {
        cycleNumber,
        totalCycleTime,
        apiCallTime,
        processingTime,
        stateUpdateTime,
        timestamp: Date.now(),
        pedestrianCount: pedestrians.length,
        success: true
      };
      
      console.log(`      ✅ Cycle ${cycleNumber}: ${totalCycleTime.toFixed(2)}ms (${pedestrians.length} pedestrians)`);
      return metrics;
      
    } catch (error) {
      console.error(`      ❌ Cycle ${cycleNumber} failed:`, error);
      
      const failedMetrics: WarmOperationMetrics = {
        cycleNumber,
        totalCycleTime: performance.now() - cycleStartTime,
        apiCallTime: 0,
        processingTime: 0,
        stateUpdateTime: 0,
        timestamp: Date.now(),
        pedestrianCount: 0,
        success: false
      };
      
      return failedMetrics;
    }
  }
  
  /**
   * Perform SDSM API call (warm operation)
   */
  private async performAPICall(): Promise<any> {
    const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }
    
    const responseText = await response.text();
    return JSON.parse(responseText);
  }
  
  /**
   * Perform data processing (warm operation)
   */
  private performProcessing(data: any): {
    pedestrians: any[];
    pedestriansInCrosswalk: number;
    nearbyPedestrians: number;
  } {
    // Extract pedestrians from SDSM data
    const pedestrians = this.extractPedestrians(data);
    
    // Sample vehicle position for testing
    const sampleVehiclePosition: [number, number] = [35.03976132931588, -85.29203348931138];
    
    // Count pedestrians in crosswalk and nearby
    let pedestriansInCrosswalk = 0;
    let nearbyPedestrians = 0;
    
    for (const pedestrian of pedestrians) {
      if (CrosswalkDetectionService.isInCrosswalk(pedestrian.coordinates)) {
        pedestriansInCrosswalk++;
      }
      
      if (ProximityDetectionService.isVehicleCloseToPosition(sampleVehiclePosition, pedestrian.coordinates)) {
        nearbyPedestrians++;
      }
    }
    
    return {
      pedestrians,
      pedestriansInCrosswalk,
      nearbyPedestrians
    };
  }
  
  /**
   * Perform state update (warm operation)
   */
  private performStateUpdate(pedestrians: any[], pedestriansInCrosswalk: number, nearbyPedestrians: number): void {
    // Simulate state update work
    const stateData = {
      pedestrians,
      pedestriansInCrosswalk,
      nearbyPedestrians,
      lastUpdate: Date.now()
    };
    
    // Simulate state update processing
    JSON.stringify(stateData);
  }
  
  /**
   * Extract pedestrians from SDSM data
   */
  private extractPedestrians(data: any): any[] {
    if (!data?.objects || !Array.isArray(data.objects)) {
      return [];
    }
    
    return data.objects
      .filter((obj: any) => obj.type === 'vru')
      .map((obj: any) => ({
        id: obj.objectID,
        coordinates: obj.location.coordinates, // [lat, lon]
        timestamp: obj.timestamp,
        heading: obj.heading,
        speed: obj.speed
      }));
  }
  
  /**
   * Calculate summary statistics from warm cycles
   */
  private calculateSummary(): WarmOperationSummary {
    const successfulCycles = this.warmCycles.filter(cycle => cycle.success);
    
    if (successfulCycles.length === 0) {
      return {
        totalCycles: this.warmCycles.length,
        averageCycleTime: 0,
        fastestCycle: 0,
        slowestCycle: 0,
        averageApiTime: 0,
        averageProcessingTime: 0,
        averageStateUpdateTime: 0,
        successRate: 0
      };
    }
    
    const cycleTimes = successfulCycles.map(cycle => cycle.totalCycleTime);
    const apiTimes = successfulCycles.map(cycle => cycle.apiCallTime);
    const processingTimes = successfulCycles.map(cycle => cycle.processingTime);
    const stateUpdateTimes = successfulCycles.map(cycle => cycle.stateUpdateTime);
    
    return {
      totalCycles: this.warmCycles.length,
      averageCycleTime: this.average(cycleTimes),
      fastestCycle: Math.min(...cycleTimes),
      slowestCycle: Math.max(...cycleTimes),
      averageApiTime: this.average(apiTimes),
      averageProcessingTime: this.average(processingTimes),
      averageStateUpdateTime: this.average(stateUpdateTimes),
      successRate: (successfulCycles.length / this.warmCycles.length) * 100
    };
  }
  
  /**
   * Log warm operation results
   */
  private logWarmOperationResults(summary: WarmOperationSummary): void {
    console.log('\n🔥 WARM OPERATION MEASUREMENT RESULTS:');
    console.log('======================================');
    console.log(`Total Cycles Measured: ${summary.totalCycles}`);
    console.log(`Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`Average Cycle Time: ${summary.averageCycleTime.toFixed(2)}ms`);
    console.log(`Fastest Cycle: ${summary.fastestCycle.toFixed(2)}ms`);
    console.log(`Slowest Cycle: ${summary.slowestCycle.toFixed(2)}ms`);
    
    if (summary.averageCycleTime > 0) {
      // Performance breakdown
      const apiPercent = (summary.averageApiTime / summary.averageCycleTime * 100).toFixed(1);
      const processingPercent = (summary.averageProcessingTime / summary.averageCycleTime * 100).toFixed(1);
      const statePercent = (summary.averageStateUpdateTime / summary.averageCycleTime * 100).toFixed(1);
      
      console.log('\nWarm Operation Breakdown:');
      console.log(`Average API Call: ${summary.averageApiTime.toFixed(2)}ms (${apiPercent}%)`);
      console.log(`Average Processing: ${summary.averageProcessingTime.toFixed(2)}ms (${processingPercent}%)`);
      console.log(`Average State Update: ${summary.averageStateUpdateTime.toFixed(2)}ms (${statePercent}%)`);
    }
    
    console.log('======================================');
    console.log('🎯 These represent detection cycles after app warm-up');
    console.log('   (subsequent operations with optimized performance)');
    console.log('======================================\n');
  }
  
  /**
   * Utility: Calculate average of numbers
   */
  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
  
  /**
   * Utility: Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get current warm cycle data
   */
  getWarmCycles(): WarmOperationMetrics[] {
    return [...this.warmCycles];
  }
}