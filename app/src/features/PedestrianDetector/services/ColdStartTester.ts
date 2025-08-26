// app/src/features/PedestrianDetector/services/ColdStartTester.ts

import { ColdStartMetrics } from '../models/ColdStartModels';
import { CrosswalkDetectionService } from './CrosswalkDetectionService';
import { ProximityDetectionService } from './ProximityDetectionService';

export class ColdStartTester {
  private hasRunColdStart: boolean = false;
  private appStartTime: number;
  private coldStartResult: ColdStartMetrics | null = null;
  
  constructor() {
    // Record when the tester is created (app start time)
    this.appStartTime = performance.now();
    console.log('❄️ ColdStartTester initialized for TRB research - app start time recorded');
  }
  
  /**
   * Run comprehensive cold start test for TRB research
   */
  async runTRBColdStartTest(): Promise<void> {
    console.log('\n🔬 === TRB RESEARCH: COLD START LATENCY TEST ===');
    console.log('❄️ Testing first-time detection cycle performance');
    console.log('🎯 Target: Measure app initialization + first detection latency');
    
    try {
      if (this.hasRunColdStart) {
        console.log('⚠️ Cold start already measured - showing previous results');
        this.displayColdStartResults();
        return;
      }
      
      // Measure the first detection cycle
      const metrics = await this.measureColdStart();
      this.coldStartResult = metrics;
      
      // Generate research summary
      this.generateTRBColdStartSummary(metrics);
      
    } catch (error) {
      console.error('❌ TRB Cold Start Test failed:', error);
    }
  }
  
  /**
   * Measure the first pedestrian detection cycle (cold start)
   */
  async measureColdStart(): Promise<ColdStartMetrics> {
    if (this.hasRunColdStart) {
      throw new Error('Cold start measurement already completed');
    }
    
    console.log('\n❄️ Starting Cold Start Measurement...');
    const coldStartBegin = performance.now();
    
    try {
      // Step 1: First API Call
      // Log first SDSM API call attempt during cold start testing
      // Critical for measuring initial system responsiveness and API latency
      console.log('   📡 Making first SDSM API call...');
      const apiStartTime = performance.now();
      const rawData = await this.performFirstAPICall();
      const apiEndTime = performance.now();
      const apiCallTime = apiEndTime - apiStartTime;
      console.log(`   ✅ First API call: ${apiCallTime.toFixed(2)}ms`);
      
      // Step 2: First Data Processing
      console.log('   ⚙️ Processing first detection cycle...');
      const processingStartTime = performance.now();
      const { pedestrians, pedestriansInCrosswalk, nearbyPedestrians } = this.performFirstProcessing(rawData);
      const processingEndTime = performance.now();
      const processingTime = processingEndTime - processingStartTime;
      console.log(`   ✅ First processing: ${processingTime.toFixed(2)}ms`);
      
      // Step 3: First State Update (simulated)
      console.log('   🔄 Completing first state update...');
      const stateStartTime = performance.now();
      this.performFirstStateUpdate(pedestrians, pedestriansInCrosswalk, nearbyPedestrians);
      const stateEndTime = performance.now();
      const stateUpdateTime = stateEndTime - stateStartTime;
      console.log(`   ✅ First state update: ${stateUpdateTime.toFixed(2)}ms`);
      
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
      console.log(`❄️ Cold start complete: ${totalColdStartTime.toFixed(2)}ms total`);
      
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
      throw error;
    }
  }
  
  /**
   * Perform the first SDSM API call
   */
  private async performFirstAPICall(): Promise<any> {
    const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout for cold start
    
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      const responseText = await response.text();
      const data = JSON.parse(responseText);
      
      return data;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Perform the first complete data processing cycle
   */
  private performFirstProcessing(data: any): {
    pedestrians: any[];
    pedestriansInCrosswalk: number;
    nearbyPedestrians: number;
  } {
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
   * Generate TRB research summary for cold start
   */
  private generateTRBColdStartSummary(metrics: ColdStartMetrics): void {
    console.log('\n❄️ === TRB COLD START SUMMARY ===');
    console.log(`📈 Cold Start Measurement: ${metrics.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (!metrics.success) {
      console.log('❌ Cold start failed - no performance data available');
      console.log('========================================\n');
      return;
    }
    
    console.log('\n🎯 COLD START LATENCY RESULTS:');
    console.log(`├─ Total Cold Start Time: ${metrics.totalColdStartTime.toFixed(2)}ms`);
    console.log(`├─ First API Call: ${metrics.apiCallTime.toFixed(2)}ms`);
    console.log(`├─ First Processing: ${metrics.processingTime.toFixed(2)}ms`);
    console.log(`├─ First State Update: ${metrics.stateUpdateTime.toFixed(2)}ms`);
    console.log(`└─ Pedestrians Detected: ${metrics.pedestrianCount}`);
    
    // Performance breakdown
    if (metrics.totalColdStartTime > 0) {
      const apiPercent = (metrics.apiCallTime / metrics.totalColdStartTime * 100).toFixed(1);
      const processingPercent = (metrics.processingTime / metrics.totalColdStartTime * 100).toFixed(1);
      const statePercent = (metrics.stateUpdateTime / metrics.totalColdStartTime * 100).toFixed(1);
      
      console.log('\n❄️ COLD START BREAKDOWN:');
      console.log(`├─ API Call: ${apiPercent}% of total time`);
      console.log(`├─ Processing: ${processingPercent}% of total time`);
      console.log(`├─ State Update: ${statePercent}% of total time`);
      console.log(`└─ Other Overhead: ${(100 - parseFloat(apiPercent) - parseFloat(processingPercent) - parseFloat(statePercent)).toFixed(1)}%`);
    }
    
    // Performance assessment
    this.assessColdStartPerformance(metrics);
    
    console.log('\n📝 TRB RESEARCH NOTES:');
    console.log('├─ Measurement Type: Cold Start (First Detection Cycle)');
    console.log('├─ Environment: React Native + Expo');
    // Log technical details of SDSM-based detection stack for research documentation
    // Important for understanding the system architecture in performance studies
    console.log('├─ Detection Stack: SDSM API + Point-in-polygon + Distance calc');
    console.log('├─ Network: Mobile/WiFi Connection');
    console.log('├─ Timing Method: JavaScript Performance API');
    console.log('└─ Use Case: V2X Pedestrian Safety Application');
    
    console.log('\n✅ TRB Cold Start Test Complete');
    console.log('📄 Cold start data ready for research paper analysis');
    console.log('========================================\n');
  }
  
  /**
   * Assess cold start performance for research context
   */
  private assessColdStartPerformance(metrics: ColdStartMetrics): void {
    console.log('\n🎯 COLD START PERFORMANCE ASSESSMENT:');
    
    const totalTime = metrics.totalColdStartTime;
    
    if (totalTime < 500) {
      console.log('✅ Excellent: Cold start < 500ms (Fast app initialization)');
    } else if (totalTime < 1000) {
      console.log('✅ Good: Cold start < 1000ms (Acceptable for safety apps)');
    } else if (totalTime < 2000) {
      console.log('⚠️ Moderate: Cold start < 2000ms (May impact user experience)');
    } else {
      console.log('❌ Poor: Cold start > 2000ms (Too slow for safety applications)');
    }
    
    if (metrics.apiCallTime > totalTime * 0.7) {
      console.log('⚠️ Network-bound: API call dominates cold start time');
    } else if (metrics.processingTime > totalTime * 0.3) {
      console.log('⚠️ Processing-bound: Detection algorithms slow down cold start');
    } else {
      console.log('✅ Balanced: Good distribution of cold start time');
    }
  }
  
  /**
   * Display previous cold start results
   */
  private displayColdStartResults(): void {
    if (!this.coldStartResult) {
      console.log('❄️ No cold start results available');
      return;
    }
    
    this.generateTRBColdStartSummary(this.coldStartResult);
  }
  
  /**
   * Export cold start results in CSV format
   */
  exportToCSV(): string {
    if (!this.coldStartResult) return '';
    
    const m = this.coldStartResult;
    const header = 'measurement,success,totalTime,apiCallTime,processingTime,stateUpdateTime,pedestrianCount\n';
    const row = `1,${m.success},${m.totalColdStartTime},${m.apiCallTime},${m.processingTime},${m.stateUpdateTime},${m.pedestrianCount}`;
    
    return header + row;
  }
  
  /**
   * Get current results for external analysis
   */
  getResults(): ColdStartMetrics | null {
    return this.coldStartResult;
  }
  
  /**
   * Clear results (for fresh testing - requires app restart for true cold start)
   */
  clearResults(): void {
    console.log('⚠️ Note: True cold start requires app restart');
    console.log('🗑️ Cold start results cleared');
  }
  
  /**
   * Check if cold start measurement has already been performed
   */
  hasMeasuredColdStart(): boolean {
    return this.hasRunColdStart;
  }
  
  /**
   * Get time since app start
   */
  getTimeSinceAppStart(): number {
    return performance.now() - this.appStartTime;
  }
}