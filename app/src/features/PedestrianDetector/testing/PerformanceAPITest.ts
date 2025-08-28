// app/src/features/PedestrianDetector/testing/PerformanceAPITest.ts

import { SimplePerformanceTester } from '../services/SimplePerformanceTester';
import { SimplePerformanceMetrics } from '../models/PerformanceModels';

export class PerformanceAPITest {
  private simplePerformanceTester: SimplePerformanceTester;
  private measurements: SimplePerformanceMetrics[] = [];
  
  constructor() {
    this.simplePerformanceTester = new SimplePerformanceTester();
  }
  
  /**
   * Run comprehensive API performance testing for TRB research
   */
  async runTRBPerformanceTest(): Promise<void> {
    // Removed API latency testing log to reduce noise
    
    try {
      // Run multiple measurements for statistical analysis
      await this.runMultipleMeasurements(10);
      
      // Generate research summary
      this.generateTRBSummary();
      
    } catch (error) {
    }
  }
  
  /**
   * Run multiple API measurements for statistical analysis
   */
  private async runMultipleMeasurements(count: number): Promise<void> {
    
    for (let i = 1; i <= count; i++) {
      try {
        
        const metrics = await this.simplePerformanceTester.testPerformanceAPI();
        this.measurements.push(metrics);
        
        // Brief pause between measurements
        if (i < count) {
          await this.wait(2000);
        }
        
      } catch (error) {
      }
    }
  }
  
  /**
   * Generate TRB research summary with statistical analysis
   */
  private generateTRBSummary(): void {
    if (this.measurements.length === 0) {
      return;
    }
    
    
    // Calculate statistics
    const stats = this.calculateStatistics();
    
    // Log research-grade results
    
    
    // Removed API endpoint log to reduce noise
    
    // Performance assessment
    this.assessPerformance(stats);
    
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
    
    if (stats.avgTotal < 100) {
    } else if (stats.avgTotal < 500) {
    } else if (stats.avgTotal < 1000) {
    } else {
    }
    
    if (stats.stdDev < stats.avgTotal * 0.2) {
    } else {
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