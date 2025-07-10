// app/src/features/PedestrianDetector/services/ColdStartTester.ts

import { ColdStartMetrics } from '../models/ColdStartModels';
import { CrosswalkDetectionService } from './CrosswalkDetectionService';
import { ProximityDetectionService } from './ProximityDetectionService';

export class ColdStartTester {
  private hasRunColdStart: boolean = false;
  private appStartTime: number;
  
  constructor() {
    // Record when the tester is created (app start time)
    this.appStartTime = performance.now();
    console.log('❄️ Cold Start Tester initialized - app start time recorded');
  }
  
  /**
   * Measure the first pedestrian detection cycle (cold start)
   */
  async measureColdStart(): Promise<ColdStartMetrics> {
    if (this.hasRunColdStart) {
      throw new Error('Cold start measurement already completed');
    }
    
    console.log('❄️ Starting Cold Start Measurement...');
    const coldStartBegin = performance.now();
    
    try {
      // Step 1: First API Call
      const apiStartTime = performance.now();
      const rawData = await this.performFirstAPICall();
      const apiEndTime = performance.now();
      const apiCallTime = apiEndTime - apiStartTime;
      
      // Step 2: First Data Processing
      const processingStartTime = performance.now();
      const { pedestrians, pedestriansInCrosswalk, nearbyPedestrians } = this.performFirstProcessing(rawData);
      const processingEndTime = performance.now();
      const processingTime = processingEndTime - processingStartTime;
      
      // Step 3: First State Update (simulated)
      const stateStartTime = performance.now();
      this.performFirstStateUpdate(pedestrians, pedestriansInCrosswalk, nearbyPedestrians);
      const stateEndTime = performance.now();
      const stateUpdateTime = stateEndTime - stateStartTime;
      
      // Calculate total time
      const totalColdStartTime = performance.now() - coldStartBegin;
      
      const metrics: ColdStartMetrics = {
        totalColdStartTime,
        apiCallTime,
        processingTime,
        stateUpdateTime,
        timestamp: Date.now(),
        pedestrianCount: pedestrians.length,
        success: true
      };
      
      this.hasRunColdStart = true;
      this.logColdStartResults(metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Cold start measurement failed:', error);
      
      const failedMetrics: ColdStartMetrics = {
        totalColdStartTime: performance.now() - coldStartBegin,
        apiCallTime: 0,
        processingTime: 0,
        stateUpdateTime: 0,
        timestamp: Date.now(),
        pedestrianCount: 0,
        success: false
      };
      
      this.hasRunColdStart = true;
      this.logColdStartResults(failedMetrics);
      throw error;
    }
  }
  
  /**
   * Perform the first SDSM API call
   */
  private async performFirstAPICall(): Promise<any> {
    const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
    console.log('   📡 Making first SDSM API call...');
    
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
    const data = JSON.parse(responseText);
    
    console.log('   ✅ First API call completed');
    return data;
  }
  
  /**
   * Perform the first complete data processing cycle
   */
  private performFirstProcessing(data: any): {
    pedestrians: any[];
    pedestriansInCrosswalk: number;
    nearbyPedestrians: number;
  } {
    console.log('   ⚙️ Processing first detection cycle...');
    
    // Extract pedestrians from SDSM data
    const pedestrians = this.extractPedestrians(data);
    
    // Sample vehicle position for testing
    const sampleVehiclePosition: [number, number] = [35.03976132931588, -85.29203348931138];
    
    // Count pedestrians in crosswalk
    let pedestriansInCrosswalk = 0;
    let nearbyPedestrians = 0;
    
    for (const pedestrian of pedestrians) {
      // Crosswalk detection
      if (CrosswalkDetectionService.isInCrosswalk(pedestrian.coordinates)) {
        pedestriansInCrosswalk++;
      }
      
      // Proximity detection
      if (ProximityDetectionService.isVehicleCloseToPosition(sampleVehiclePosition, pedestrian.coordinates)) {
        nearbyPedestrians++;
      }
    }
    
    console.log(`   📊 Processed ${pedestrians.length} pedestrians (${pedestriansInCrosswalk} in crosswalk, ${nearbyPedestrians} nearby)`);
    
    return {
      pedestrians,
      pedestriansInCrosswalk,
      nearbyPedestrians
    };
  }
  
  /**
   * Simulate first state update
   */
  private performFirstStateUpdate(pedestrians: any[], pedestriansInCrosswalk: number, nearbyPedestrians: number): void {
    console.log('   🔄 Completing first state update...');
    
    // Simulate the time it takes to update observable state
    // In real app, this would be runInAction() calls to update MobX state
    const stateData = {
      pedestrians,
      pedestriansInCrosswalk,
      nearbyPedestrians,
      lastUpdate: Date.now()
    };
    
    // Small processing to simulate state update work
    JSON.stringify(stateData);
    
    console.log('   ✅ First state update completed');
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
   * Log cold start measurement results
   */
  private logColdStartResults(metrics: ColdStartMetrics): void {
    const appBootTime = this.appStartTime;
    const totalAppTime = metrics.timestamp - (Date.now() - performance.now()) + appBootTime;
    
    console.log('\n❄️ COLD START BASELINE MEASUREMENT:');
    console.log('=====================================');
    console.log(`Status: ${metrics.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Total Cold Start Time: ${metrics.totalColdStartTime.toFixed(2)}ms`);
    console.log(`API Call Time: ${metrics.apiCallTime.toFixed(2)}ms`);
    console.log(`Processing Time: ${metrics.processingTime.toFixed(2)}ms`);
    console.log(`State Update Time: ${metrics.stateUpdateTime.toFixed(2)}ms`);
    console.log(`Pedestrians Detected: ${metrics.pedestrianCount}`);
    
    if (metrics.success && metrics.totalColdStartTime > 0) {
      // Performance breakdown
      const apiPercent = (metrics.apiCallTime / metrics.totalColdStartTime * 100).toFixed(1);
      const processingPercent = (metrics.processingTime / metrics.totalColdStartTime * 100).toFixed(1);
      const statePercent = (metrics.stateUpdateTime / metrics.totalColdStartTime * 100).toFixed(1);
      
      console.log('\nCold Start Breakdown:');
      console.log(`API Call: ${apiPercent}%`);
      console.log(`Processing: ${processingPercent}%`);
      console.log(`State Update: ${statePercent}%`);
    }
    
    console.log('=====================================');
    console.log('🎯 This represents the first detection cycle performance');
    console.log('   after a fresh app launch (cold start scenario)');
    console.log('=====================================\n');
  }
  
  /**
   * Check if cold start measurement has already been performed
   */
  hasMeasuredColdStart(): boolean {
    return this.hasRunColdStart;
  }
}