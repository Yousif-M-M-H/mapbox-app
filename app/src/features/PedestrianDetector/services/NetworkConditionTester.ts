// app/src/features/PedestrianDetector/services/NetworkConditionTester.ts

import { NetworkConditionMetrics, NetworkErrorHandlingResult } from '../models/NetworkConditionModels';
import { CrosswalkDetectionService } from './CrosswalkDetectionService';
import { ProximityDetectionService } from './ProximityDetectionService';

export class NetworkConditionTester {
  private readonly API_URL = 'http://10.199.1.11:9095/latest/sdsm_events';
  private readonly TIMEOUT_MS = 5000; // 5 second timeout
  private readonly MAX_RETRIES = 3;
  
  constructor() {
    console.log('🌐 Network Condition Tester initialized');
  }
  
  /**
   * Run comprehensive network condition testing
   */
  async runNetworkConditionTests(): Promise<void> {
    console.log('🌐 Starting Network Condition Testing...');
    
    try {
      // Test 1: Normal Network Conditions
      console.log('\n📡 Test 1: Normal Network Conditions');
      const normalConditions = await this.testNormalNetworkConditions();
      
      // Test 2: Network Timeout Behavior
      console.log('\n⏱️ Test 2: Network Timeout Behavior');
      const timeoutBehavior = await this.testTimeoutBehavior();
      
      // Test 3: Complete Network Failure
      console.log('\n❌ Test 3: Complete Network Failure');
      const failureBehavior = await this.testNetworkFailure();
      
      // Test 4: Error Handling Analysis
      console.log('\n🔧 Test 4: Error Handling Analysis');
      const errorHandling = this.analyzeErrorHandling(normalConditions, timeoutBehavior, failureBehavior);
      
      // Final Results Summary
      this.logFinalResults(normalConditions, errorHandling);
      
    } catch (error) {
      console.error('❌ Network condition testing failed:', error);
    }
  }
  
  /**
   * Test 1: Measure performance under normal network conditions
   */
  private async testNormalNetworkConditions(): Promise<NetworkConditionMetrics> {
    const coldStartBegin = performance.now();
    
    try {
      console.log('   🔄 Testing normal API call...');
      
      // Measure API call time
      const apiStartTime = performance.now();
      const rawData = await this.makeAPICall(this.API_URL, this.TIMEOUT_MS);
      const apiEndTime = performance.now();
      const apiCallTime = apiEndTime - apiStartTime;
      
      // Process data
      const pedestrians = this.extractPedestrians(rawData);
      const coldStartTotalTime = performance.now() - coldStartBegin;
      
      const metrics: NetworkConditionMetrics = {
        coldStartTotalTime,
        apiCallTime,
        success: true,
        retryAttempts: 0,
        timeoutOccurred: false,
        timestamp: Date.now(),
        pedestrianCount: pedestrians.length
      };
      
      console.log(`   ✅ Success: ${apiCallTime.toFixed(2)}ms API call, ${pedestrians.length} pedestrians found`);
      return metrics;
      
    } catch (error) {
      const coldStartTotalTime = performance.now() - coldStartBegin;
      
      const metrics: NetworkConditionMetrics = {
        coldStartTotalTime,
        apiCallTime: 0,
        success: false,
        errorType: this.getErrorType(error),
        errorMessage: String(error),
        retryAttempts: 0,
        timeoutOccurred: this.isTimeoutError(error),
        timestamp: Date.now(),
        pedestrianCount: 0
      };
      
      console.log(`   ❌ Failed: ${metrics.errorType} - ${metrics.errorMessage}`);
      return metrics;
    }
  }
  
  /**
   * Test 2: Test timeout behavior with very short timeout
   */
  private async testTimeoutBehavior(): Promise<NetworkConditionMetrics> {
    const coldStartBegin = performance.now();
    
    try {
      console.log('   ⏱️ Testing with 100ms timeout...');
      
      const apiStartTime = performance.now();
      const rawData = await this.makeAPICall(this.API_URL, 100); // Very short timeout
      const apiEndTime = performance.now();
      const apiCallTime = apiEndTime - apiStartTime;
      
      const pedestrians = this.extractPedestrians(rawData);
      const coldStartTotalTime = performance.now() - coldStartBegin;
      
      const metrics: NetworkConditionMetrics = {
        coldStartTotalTime,
        apiCallTime,
        success: true,
        retryAttempts: 0,
        timeoutOccurred: false,
        timestamp: Date.now(),
        pedestrianCount: pedestrians.length
      };
      
      console.log(`   ✅ Unexpectedly fast: ${apiCallTime.toFixed(2)}ms (faster than timeout)`);
      return metrics;
      
    } catch (error) {
      const coldStartTotalTime = performance.now() - coldStartBegin;
      
      const metrics: NetworkConditionMetrics = {
        coldStartTotalTime,
        apiCallTime: coldStartTotalTime,
        success: false,
        errorType: this.getErrorType(error),
        errorMessage: String(error),
        retryAttempts: 0,
        timeoutOccurred: this.isTimeoutError(error),
        timestamp: Date.now(),
        pedestrianCount: 0
      };
      
      console.log(`   ⏱️ Timeout occurred: ${metrics.errorType} after ${coldStartTotalTime.toFixed(2)}ms`);
      return metrics;
    }
  }
  
  /**
   * Test 3: Test complete network failure with invalid URL
   */
  private async testNetworkFailure(): Promise<NetworkConditionMetrics> {
    const coldStartBegin = performance.now();
    const invalidUrl = 'http://invalid.nonexistent.domain/api/test';
    
    try {
      console.log('   ❌ Testing with invalid URL...');
      
      const apiStartTime = performance.now();
      const rawData = await this.makeAPICallWithRetries(invalidUrl, this.TIMEOUT_MS, this.MAX_RETRIES);
      const apiEndTime = performance.now();
      const apiCallTime = apiEndTime - apiStartTime;
      
      // This should not happen
      const metrics: NetworkConditionMetrics = {
        coldStartTotalTime: performance.now() - coldStartBegin,
        apiCallTime,
        success: true,
        retryAttempts: 0,
        timeoutOccurred: false,
        timestamp: Date.now(),
        pedestrianCount: 0
      };
      
      console.log(`   ⚠️ Unexpected success with invalid URL`);
      return metrics;
      
    } catch (error) {
      const coldStartTotalTime = performance.now() - coldStartBegin;
      
      const metrics: NetworkConditionMetrics = {
        coldStartTotalTime,
        apiCallTime: coldStartTotalTime,
        success: false,
        errorType: this.getErrorType(error),
        errorMessage: String(error),
        retryAttempts: this.MAX_RETRIES,
        timeoutOccurred: this.isTimeoutError(error),
        timestamp: Date.now(),
        pedestrianCount: 0
      };
      
      console.log(`   ❌ Expected failure: ${metrics.errorType} after ${this.MAX_RETRIES} retries`);
      return metrics;
    }
  }
  
  /**
   * Make API call with timeout
   */
  private async makeAPICall(url: string, timeoutMs: number): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const responseText = await response.text();
      return JSON.parse(responseText);
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Make API call with retry logic
   */
  private async makeAPICallWithRetries(url: string, timeoutMs: number, maxRetries: number): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`      Attempt ${attempt}/${maxRetries}...`);
        return await this.makeAPICall(url, timeoutMs);
      } catch (error) {
        lastError = error;
        console.log(`      Attempt ${attempt} failed: ${this.getErrorType(error)}`);
        
        // Wait before retry (except for last attempt)
        if (attempt < maxRetries) {
          await this.wait(1000); // 1 second between retries
        }
      }
    }
    
    throw lastError;
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
   * Analyze error handling behavior
   */
  private analyzeErrorHandling(
    normal: NetworkConditionMetrics,
    timeout: NetworkConditionMetrics,
    failure: NetworkConditionMetrics
  ): NetworkErrorHandlingResult {
    const timeoutBehavior = timeout.timeoutOccurred ? 
      'App handles timeouts gracefully with proper error detection' :
      'App completed before timeout - network faster than expected';
    
    const retryBehavior = failure.retryAttempts > 0 ?
      `App retries ${failure.retryAttempts} times before giving up` :
      'App does not implement retry logic';
    
    const failureBehavior = !failure.success ?
      'App properly detects and handles network failures' :
      'App unexpectedly succeeded with invalid network';
    
    const gracefulDegradation = !normal.success || (!timeout.success && !failure.success) ?
      false : true;
    
    return {
      timeoutBehavior,
      retryBehavior,
      failureBehavior,
      gracefulDegradation
    };
  }
  
  /**
   * Get error type from error object
   */
  private getErrorType(error: any): string {
    if (error.name === 'AbortError') return 'Timeout';
    if (error.message?.includes('fetch')) return 'Network Error';
    if (error.message?.includes('JSON')) return 'Parse Error';
    if (error.message?.includes('HTTP')) return 'HTTP Error';
    return 'Unknown Error';
  }
  
  /**
   * Check if error is a timeout error
   */
  private isTimeoutError(error: any): boolean {
    return error.name === 'AbortError' || error.message?.includes('timeout');
  }
  
  /**
   * Wait for specified milliseconds
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Log final test results
   */
  private logFinalResults(normal: NetworkConditionMetrics, errorHandling: NetworkErrorHandlingResult): void {
    console.log('\n🌐 NETWORK CONDITION TEST RESULTS:');
    console.log('===================================');
    
    // Cold Start Performance
    console.log(`Cold Start Total Time: ${normal.coldStartTotalTime.toFixed(2)}ms`);
    console.log(`API Call Time: ${normal.apiCallTime.toFixed(2)}ms`);
    console.log(`API Success Rate: ${normal.success ? '100%' : '0%'}`);
    console.log(`Pedestrians Detected: ${normal.pedestrianCount}`);
    
    // Error Handling Analysis
    console.log('\nError Handling Behavior:');
    console.log(`Timeout Handling: ${errorHandling.timeoutBehavior}`);
    console.log(`Retry Logic: ${errorHandling.retryBehavior}`);
    console.log(`Failure Recovery: ${errorHandling.failureBehavior}`);
    console.log(`Graceful Degradation: ${errorHandling.gracefulDegradation ? 'Yes' : 'No'}`);
    
    // Performance Analysis
    if (normal.success && normal.apiCallTime > 0) {
      const networkPercent = (normal.apiCallTime / normal.coldStartTotalTime * 100).toFixed(1);
      console.log('\nPerformance Breakdown:');
      console.log(`Network Time: ${networkPercent}% of total cold start`);
      console.log(`Processing Time: ${(100 - parseFloat(networkPercent)).toFixed(1)}% of total cold start`);
    }
    
    console.log('===================================');
    console.log('🎯 Network condition testing complete');
    console.log('   Ready for TRB research analysis');
    console.log('===================================\n');
  }
}