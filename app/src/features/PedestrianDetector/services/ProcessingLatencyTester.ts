// app/src/features/PedestrianDetector/services/ProcessingLatencyTester.ts

import { ProcessingLatencyMetrics } from '../models/ProcessingModels';
import { CrosswalkDetectionService } from './CrosswalkDetectionService';
import { ProximityDetectionService } from './ProximityDetectionService';

export class ProcessingLatencyTester {
  private measurements: ProcessingLatencyMetrics[] = [];
  
  constructor() {
    console.log('⚙️ ProcessingLatencyTester initialized for TRB research');
  }
  
  /**
   * Run comprehensive processing latency test for TRB research
   */
  async runTRBProcessingLatencyTest(): Promise<void> {
    console.log('\n🔬 === TRB RESEARCH: PROCESSING LATENCY TEST ===');
    console.log('⚙️ Testing pedestrian detection processing times');
    console.log('🎯 Target: Measure real-time processing capabilities');
    
    try {
      // Run multiple measurements for statistical analysis
      await this.runMultipleProcessingTests(10);
      
      // Generate research summary
      this.generateTRBProcessingSummary();
      
    } catch (error) {
      console.error('❌ TRB Processing Latency Test failed:', error);
    }
  }
  
  /**
   * Run multiple processing measurements for statistical analysis
   */
  private async runMultipleProcessingTests(count: number): Promise<void> {
    console.log(`\n📈 Running ${count} processing measurements...`);
    
    for (let i = 1; i <= count; i++) {
      try {
        console.log(`\n⚙️ Processing Test ${i}/${count}`);
        
        const metrics = await this.testSingleProcessingCycle();
        this.measurements.push(metrics);
        
        // Brief pause between measurements
        if (i < count) {
          console.log('   ⏳ Waiting 1 second...');
          await this.wait(1000);
        }
        
      } catch (error) {
        console.warn(`⚠️ Processing test ${i} failed:`, error);
      }
    }
  }
  
  /**
   * Test processing latency for a single cycle
   */
  async testSingleProcessingCycle(): Promise<ProcessingLatencyMetrics> {
    // Log SDSM data fetch operation during processing latency testing
    // Essential for measuring data retrieval time in performance analysis
    console.log('   📡 Fetching fresh SDSM data...');
    
    try {
      // Get sample SDSM data from API
      const rawJsonData = await this.fetchSampleData();
      
      // Test 1: JSON Parsing
      const jsonParsingTime = this.measureJsonParsing(rawJsonData);
      
      // Test 2: Data Extraction (VRU filtering)
      const { dataExtractionTime, pedestrians } = this.measureDataExtraction(rawJsonData);
      
      // Test 3: Crosswalk Detection
      const crosswalkDetectionTime = this.measureCrosswalkDetection(pedestrians);
      
      // Test 4: Proximity Detection
      const proximityDetectionTime = this.measureProximityDetection(pedestrians);
      
      // Calculate totals
      const totalProcessingTime = jsonParsingTime + dataExtractionTime + crosswalkDetectionTime + proximityDetectionTime;
      
      const metrics: ProcessingLatencyMetrics = {
        jsonParsingTime,
        dataExtractionTime,
        crosswalkDetectionTime,
        proximityDetectionTime,
        totalProcessingTime,
        timestamp: Date.now(),
        pedestrianCount: pedestrians.length
      };
      
      console.log(`   ✅ Total processing: ${totalProcessingTime.toFixed(2)}ms (${pedestrians.length} pedestrians)`);
      
      return metrics;
      
    } catch (error) {
      console.error('   ❌ Processing test failed:', error);
      throw error;
    }
  }
  
  /**
   * Fetch sample SDSM data for testing
   */
  private async fetchSampleData(): Promise<string> {
    const apiUrl = 'http://10.199.1.11:9095/latest/sdsm_events';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`SDSM API error: ${response.status}`);
    }
    
    return await response.text();
  }
  
  /**
   * Test 1: Measure JSON parsing time
   */
  private measureJsonParsing(rawJsonData: string): number {
    const startTime = performance.now();
    
    // Parse JSON (this is what we're measuring)
    const parsedData = JSON.parse(rawJsonData);
    
    const endTime = performance.now();
    const parseTime = endTime - startTime;
    
    console.log(`   📄 JSON Parse: ${parseTime.toFixed(2)}ms`);
    return parseTime;
  }
  
  /**
   * Test 2: Measure data extraction (VRU filtering) time
   */
  private measureDataExtraction(rawJsonData: string): { dataExtractionTime: number; pedestrians: any[] } {
    const parsedData = JSON.parse(rawJsonData);
    
    const startTime = performance.now();
    
    // Extract VRU objects (this is what we're measuring)
    const pedestrians = this.extractVRUObjects(parsedData);
    
    const endTime = performance.now();
    const extractionTime = endTime - startTime;
    
    console.log(`   🔍 Data Extract: ${extractionTime.toFixed(2)}ms (${pedestrians.length} VRUs found)`);
    
    return {
      dataExtractionTime: extractionTime,
      pedestrians
    };
  }
  
  /**
   * Test 3: Measure crosswalk detection time
   */
  private measureCrosswalkDetection(pedestrians: any[]): number {
    if (pedestrians.length === 0) {
      console.log('   🚶 Crosswalk Check: 0.00ms (no pedestrians)');
      return 0;
    }
    
    const startTime = performance.now();
    
    // Run crosswalk detection for all pedestrians (this is what we're measuring)
    let pedestriansInCrosswalk = 0;
    for (const pedestrian of pedestrians) {
      if (CrosswalkDetectionService.isInCrosswalk(pedestrian.coordinates)) {
        pedestriansInCrosswalk++;
      }
    }
    
    const endTime = performance.now();
    const detectionTime = endTime - startTime;
    
    console.log(`   🚶 Crosswalk Check: ${detectionTime.toFixed(2)}ms (${pedestriansInCrosswalk}/${pedestrians.length} in crosswalk)`);
    return detectionTime;
  }
  
  /**
   * Test 4: Measure proximity detection time
   */
  private measureProximityDetection(pedestrians: any[]): number {
    if (pedestrians.length === 0) {
      console.log('   📏 Proximity Check: 0.00ms (no pedestrians)');
      return 0;
    }
    
    // Use sample vehicle position for testing
    const sampleVehiclePosition: [number, number] = [35.03976132931588, -85.29203348931138];
    
    const startTime = performance.now();
    
    // Run proximity detection for all pedestrians (this is what we're measuring)
    let nearbyPedestrians = 0;
    for (const pedestrian of pedestrians) {
      if (ProximityDetectionService.isVehicleCloseToPosition(sampleVehiclePosition, pedestrian.coordinates)) {
        nearbyPedestrians++;
      }
    }
    
    const endTime = performance.now();
    const proximityTime = endTime - startTime;
    
    console.log(`   📏 Proximity Check: ${proximityTime.toFixed(2)}ms (${nearbyPedestrians}/${pedestrians.length} nearby)`);
    return proximityTime;
  }
  
  /**
   * Extract VRU (pedestrian) objects from SDSM data
   */
  private extractVRUObjects(parsedData: any): any[] {
    if (!parsedData?.objects || !Array.isArray(parsedData.objects)) {
      return [];
    }
    
    // Filter for VRU objects and convert to pedestrian format
    return parsedData.objects
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
   * Generate TRB research summary with statistical analysis
   */
  private generateTRBProcessingSummary(): void {
    if (this.measurements.length === 0) {
      console.log('❌ No successful processing measurements for analysis');
      return;
    }
    
    console.log('\n⚙️ === TRB PROCESSING LATENCY SUMMARY ===');
    console.log(`📈 Total Measurements: ${this.measurements.length}`);
    
    // Calculate statistics
    const stats = this.calculateProcessingStatistics();
    
    // Log research-grade results
    console.log('\n🎯 PROCESSING LATENCY RESULTS:');
    console.log(`├─ Average Total Processing: ${stats.avgTotal.toFixed(2)}ms`);
    console.log(`├─ Minimum Processing: ${stats.minTotal.toFixed(2)}ms`);
    console.log(`├─ Maximum Processing: ${stats.maxTotal.toFixed(2)}ms`);
    console.log(`├─ Standard Deviation: ${stats.stdDev.toFixed(2)}ms`);
    console.log(`└─ 95th Percentile: ${stats.p95.toFixed(2)}ms`);
    
    console.log('\n⚙️ PROCESSING BREAKDOWN:');
    console.log(`├─ Avg JSON Parsing: ${stats.avgJsonParse.toFixed(2)}ms (${stats.jsonParsePercent.toFixed(1)}%)`);
    console.log(`├─ Avg Data Extraction: ${stats.avgDataExtract.toFixed(2)}ms (${stats.dataExtractPercent.toFixed(1)}%)`);
    console.log(`├─ Avg Crosswalk Detection: ${stats.avgCrosswalk.toFixed(2)}ms (${stats.crosswalkPercent.toFixed(1)}%)`);
    console.log(`└─ Avg Proximity Detection: ${stats.avgProximity.toFixed(2)}ms (${stats.proximityPercent.toFixed(1)}%)`);
    
    console.log('\n📊 PROCESSING EFFICIENCY:');
    console.log(`├─ Avg Pedestrians Processed: ${stats.avgPedestrians.toFixed(1)}`);
    console.log(`├─ Processing Rate: ${stats.processingRate.toFixed(1)} pedestrians/ms`);
    console.log(`└─ Efficiency Score: ${stats.efficiencyScore.toFixed(2)} (lower is better)`);
    
    // Performance assessment
    this.assessProcessingPerformance(stats);
    
    console.log('\n📝 TRB RESEARCH NOTES:');
    console.log('├─ Processing Environment: React Native + JavaScript');
    console.log('├─ Detection Algorithms: Point-in-polygon + distance calc');
    // Log SDSM data format specification for research documentation
    // Important for understanding the V2X standard compliance in performance studies
    console.log('├─ Data Format: SDSM V2X Standard');
    console.log('├─ Measurement Method: Performance.now() API');
    console.log('└─ Statistical Analysis: 10 samples with 1s intervals');
    
    console.log('\n✅ TRB Processing Latency Test Complete');
    console.log('📄 Processing data ready for research paper analysis');
    console.log('===============================================\n');
  }
  
  /**
   * Calculate comprehensive processing statistics
   */
  private calculateProcessingStatistics() {
    const totalTimes = this.measurements.map(m => m.totalProcessingTime);
    const jsonParseTimes = this.measurements.map(m => m.jsonParsingTime);
    const dataExtractTimes = this.measurements.map(m => m.dataExtractionTime);
    const crosswalkTimes = this.measurements.map(m => m.crosswalkDetectionTime);
    const proximityTimes = this.measurements.map(m => m.proximityDetectionTime);
    const pedestrianCounts = this.measurements.map(m => m.pedestrianCount);
    
    const avgTotal = this.average(totalTimes);
    const avgJsonParse = this.average(jsonParseTimes);
    const avgDataExtract = this.average(dataExtractTimes);
    const avgCrosswalk = this.average(crosswalkTimes);
    const avgProximity = this.average(proximityTimes);
    const avgPedestrians = this.average(pedestrianCounts);
    
    return {
      avgTotal,
      minTotal: Math.min(...totalTimes),
      maxTotal: Math.max(...totalTimes),
      stdDev: this.standardDeviation(totalTimes),
      p95: this.percentile(totalTimes, 95),
      avgJsonParse,
      avgDataExtract,
      avgCrosswalk,
      avgProximity,
      avgPedestrians,
      jsonParsePercent: (avgJsonParse / avgTotal) * 100,
      dataExtractPercent: (avgDataExtract / avgTotal) * 100,
      crosswalkPercent: (avgCrosswalk / avgTotal) * 100,
      proximityPercent: (avgProximity / avgTotal) * 100,
      processingRate: avgPedestrians / avgTotal,
      efficiencyScore: avgTotal / Math.max(avgPedestrians, 1)
    };
  }
  
  /**
   * Assess processing performance for research context
   */
  private assessProcessingPerformance(stats: any): void {
    console.log('\n🎯 PROCESSING PERFORMANCE ASSESSMENT:');
    
    if (stats.avgTotal < 10) {
      console.log('✅ Excellent: Avg processing < 10ms (Real-time capable)');
    } else if (stats.avgTotal < 50) {
      console.log('✅ Good: Avg processing < 50ms (Suitable for safety apps)');
    } else if (stats.avgTotal < 100) {
      console.log('⚠️ Moderate: Avg processing < 100ms (May impact responsiveness)');
    } else {
      console.log('❌ Poor: Avg processing > 100ms (Too slow for real-time safety)');
    }
    
    if (stats.efficiencyScore < 2) {
      console.log('✅ Efficient: Good processing rate per pedestrian');
    } else {
      console.log('⚠️ Inefficient: High processing time per pedestrian');
    }
  }
  
  /**
   * Export processing results in CSV format
   */
  exportToCSV(): string {
    if (this.measurements.length === 0) return '';
    
    const header = 'measurement,totalTime,jsonParse,dataExtract,crosswalkDetect,proximityDetect,pedestrianCount\n';
    const rows = this.measurements.map((m, i) => 
      `${i + 1},${m.totalProcessingTime},${m.jsonParsingTime},${m.dataExtractionTime},${m.crosswalkDetectionTime},${m.proximityDetectionTime},${m.pedestrianCount}`
    ).join('\n');
    
    return header + rows;
  }
  
  /**
   * Get current results for external analysis
   */
  getResults(): ProcessingLatencyMetrics[] {
    return [...this.measurements];
  }
  
  /**
   * Clear all measurements
   */
  clearResults(): void {
    this.measurements = [];
    console.log('🗑️ Processing measurements cleared');
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