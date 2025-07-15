// app/src/features/PedestrianDetector/testing/PerformanceAPITest.ts

import { SimplePerformanceTester } from '../services/SimplePerformanceTester';
import { SimplePerformanceMetrics } from '../models/PerformanceModels';

export class PerformanceAPITest {
  private simplePerformanceTester: SimplePerformanceTester;
  private measurements: SimplePerformanceMetrics[] = [];
  
  constructor() {
    this.simplePerformanceTester = new SimplePerformanceTester();
    console.log('📊 PerformanceAPITest initialized for TRB research');
  }
  
  /**
   * Run comprehensive API performance testing for TRB research
   */
  async runTRBPerformanceTest(): Promise<void> {
    console.log('\n🔬 === TRB RESEARCH: API PERFORMANCE TEST ===');
    console.log('📊 Testing SDSM API latency for research paper');
    console.log('🎯 Target: Measure real-world V2X communication delays');
    
    try {
      // Run multiple measurements for statistical analysis
      await this.runMultipleMeasurements(10);
      
      // Generate research summary
      this.generateTRBSummary();
      
    } catch (error) {
      console.error('❌ TRB Performance Test failed:', error);
    }
  }
  
  /**
   * Run multiple API measurements for statistical analysis
   */
  private async runMultipleMeasurements(count: number): Promise<void> {
    console.log(`\n📈 Running ${count} API measurements...`);
    
    for (let i = 1; i <= count; i++) {
      try {
        console.log(`\n📊 Measurement ${i}/${count}`);
        
        const metrics = await this.simplePerformanceTester.testPerformanceAPI();
        this.measurements.push(metrics);
        
        // Brief pause between measurements
        if (i < count) {
          console.log('   ⏳ Waiting 2 seconds...');
          await this.wait(2000);
        }
        
      } catch (error) {
        console.warn(`⚠️ Measurement ${i} failed:`, error);
      }
    }
  }
  
  /**
   * Generate TRB research summary with statistical analysis
   */
  private generateTRBSummary(): void {
    if (this.measurements.length === 0) {
      console.log('❌ No successful measurements for analysis');
      return;
    }
    
    console.log('\n📊 === TRB RESEARCH SUMMARY ===');
    console.log(`📈 Total Measurements: ${this.measurements.length}`);
    
    // Calculate statistics
    const stats = this.calculateStatistics();
    
    // Log research-grade results
    console.log('\n🎯 API LATENCY RESULTS:');
    console.log(`├─ Average Total Time: ${stats.avgTotal.toFixed(2)}ms`);
    console.log(`├─ Minimum Time: ${stats.minTotal.toFixed(2)}ms`);
    console.log(`├─ Maximum Time: ${stats.maxTotal.toFixed(2)}ms`);
    console.log(`├─ Standard Deviation: ${stats.stdDev.toFixed(2)}ms`);
    console.log(`└─ 95th Percentile: ${stats.p95.toFixed(2)}ms`);
    
    console.log('\n🌐 NETWORK BREAKDOWN:');
    console.log(`├─ Avg Time to First Byte: ${stats.avgTTFB.toFixed(2)}ms`);
    console.log(`├─ Avg Download Time: ${stats.avgDownload.toFixed(2)}ms`);
    console.log(`├─ Avg JSON Parse Time: ${stats.avgParse.toFixed(2)}ms`);
    console.log(`└─ Avg Response Size: ${stats.avgSize.toFixed(2)}KB`);
    
    console.log('\n📝 TRB RESEARCH NOTES:');
    console.log('├─ Test Environment: React Native + Expo');
    console.log('├─ API Endpoint: SDSM Events (V2X Standard)');
    console.log('├─ Network: Mobile/WiFi Connection');
    console.log('├─ Measurement Method: JavaScript Performance API');
    console.log('└─ Statistical Analysis: 10 samples with 2s intervals');
    
    // Performance assessment
    this.assessPerformance(stats);
    
    console.log('\n✅ TRB Performance Test Complete');
    console.log('📄 Data ready for research paper analysis');
    console.log('========================================\n');
  }
  
  /**
   * Calculate comprehensive statistics for research
   */
  private calculateStatistics() {
    const totalTimes = this.measurements.map(m => m.totalRequestTime);
    const ttfbTimes = this.measurements.map(m => m.timeToFirstByte);
    const downloadTimes = this.measurements.map(m => m.downloadTime);
    const parseTimes = this.measurements.map(m => m.jsonParseTime);
    const sizes = this.measurements.map(m => m.responseSize / 1024); // Convert to KB
    
    return {
      avgTotal: this.average(totalTimes),
      minTotal: Math.min(...totalTimes),
      maxTotal: Math.max(...totalTimes),
      stdDev: this.standardDeviation(totalTimes),
      p95: this.percentile(totalTimes, 95),
      avgTTFB: this.average(ttfbTimes),
      avgDownload: this.average(downloadTimes),
      avgParse: this.average(parseTimes),
      avgSize: this.average(sizes)
    };
  }
  
  /**
   * Assess performance for research context
   */
  private assessPerformance(stats: any): void {
    console.log('\n🎯 PERFORMANCE ASSESSMENT:');
    
    if (stats.avgTotal < 100) {
      console.log('✅ Excellent: Avg latency < 100ms (Real-time capable)');
    } else if (stats.avgTotal < 500) {
      console.log('✅ Good: Avg latency < 500ms (Suitable for V2X safety)');
    } else if (stats.avgTotal < 1000) {
      console.log('⚠️ Moderate: Avg latency < 1000ms (May impact real-time safety)');
    } else {
      console.log('❌ Poor: Avg latency > 1000ms (Not suitable for real-time V2X)');
    }
    
    if (stats.stdDev < stats.avgTotal * 0.2) {
      console.log('✅ Consistent: Low latency variation (Reliable for safety apps)');
    } else {
      console.log('⚠️ Variable: High latency variation (May cause inconsistent UX)');
    }
  }
  
  /**
   * Export results in CSV format for research analysis
   */
  exportToCSV(): string {
    if (this.measurements.length === 0) return '';
    
    const header = 'measurement,totalTime,timeToFirstByte,downloadTime,parseTime,responseSize\n';
    const rows = this.measurements.map((m, i) => 
      `${i + 1},${m.totalRequestTime},${m.timeToFirstByte},${m.downloadTime},${m.jsonParseTime},${m.responseSize}`
    ).join('\n');
    
    return header + rows;
  }
  
  /**
   * Get current results for external analysis
   */
  getResults(): SimplePerformanceMetrics[] {
    return [...this.measurements];
  }
  
  /**
   * Clear all measurements
   */
  clearResults(): void {
    this.measurements = [];
    console.log('🗑️ Performance measurements cleared');
  }
  
  // ========================================
  // Utility Methods
  // ========================================
  
  private average(numbers: number[]): number {
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }
  
  private standardDeviation(numbers: number[]): number {
    const avg = this.average(numbers);
    const squaredDiffs = numbers.map(num => Math.pow(num - avg, 2));
    return Math.sqrt(this.average(squaredDiffs));
  }
  
  private percentile(numbers: number[], p: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}