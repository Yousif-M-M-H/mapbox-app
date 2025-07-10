// app/src/features/PedestrianDetector/services/SimplePerformanceTester.ts

import { SimplePerformanceMetrics } from '../models/PerformanceModels';

export class SimplePerformanceTester {
  
  /**
   * Test Performance API with a single SDSM API call
   */
  async testPerformanceAPI(): Promise<SimplePerformanceMetrics> {
    const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
    console.log('🧪 Testing Native JavaScript Performance API...');
    
    // Start timing
    const startTime = performance.now();
    
    try {
      // 1. Measure fetch start
      const fetchStartTime = performance.now();
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // 2. Measure time to first byte
      const firstByteTime = performance.now();
      
      // 3. Download response
      const responseText = await response.text();
      const downloadEndTime = performance.now();
      
      // 4. Parse JSON
      const parseStartTime = performance.now();
      const data = JSON.parse(responseText);
      const parseEndTime = performance.now();
      
      // 5. Calculate metrics
      const metrics: SimplePerformanceMetrics = {
        totalRequestTime: parseEndTime - startTime,
        timeToFirstByte: firstByteTime - fetchStartTime,
        downloadTime: downloadEndTime - firstByteTime,
        jsonParseTime: parseEndTime - parseStartTime,
        responseSize: new Blob([responseText]).size,
        timestamp: Date.now()
      };
      
      // 6. Log results
      this.logResults(metrics, data);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Performance API test failed:', error);
      throw error;
    }
  }
  
  /**
   * Log test results in a clean format
   */
  private logResults(metrics: SimplePerformanceMetrics, data: any): void {
    console.log('\n📊 PERFORMANCE API TEST RESULTS:');
    console.log('================================');
    console.log(`Total Time: ${metrics.totalRequestTime.toFixed(2)}ms`);
    console.log(`Time to First Byte: ${metrics.timeToFirstByte.toFixed(2)}ms`);
    console.log(`Download Time: ${metrics.downloadTime.toFixed(2)}ms`);
    console.log(`JSON Parse Time: ${metrics.jsonParseTime.toFixed(2)}ms`);
    console.log(`Response Size: ${(metrics.responseSize / 1024).toFixed(2)}KB`);
    
    // Check for pedestrian data
    const pedestrianCount = data?.objects?.filter((obj: any) => obj.type === 'vru').length || 0;
    console.log(`Pedestrians Found: ${pedestrianCount}`);
    
    // Performance breakdown
    const networkPercent = (metrics.timeToFirstByte / metrics.totalRequestTime * 100).toFixed(1);
    const downloadPercent = (metrics.downloadTime / metrics.totalRequestTime * 100).toFixed(1);
    const parsePercent = (metrics.jsonParseTime / metrics.totalRequestTime * 100).toFixed(1);
    
    console.log('\nPerformance Breakdown:');
    console.log(`Network: ${networkPercent}%`);
    console.log(`Download: ${downloadPercent}%`);
    console.log(`Parse: ${parsePercent}%`);
    console.log('================================\n');
  }
}