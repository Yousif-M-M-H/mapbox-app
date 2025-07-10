// app/src/features/PedestrianDetector/services/ProcessingLatencyTester.ts

import { ProcessingLatencyMetrics } from '../models/ProcessingModels';
import { CrosswalkDetectionService } from './CrosswalkDetectionService';
import { ProximityDetectionService } from './ProximityDetectionService';

export class ProcessingLatencyTester {
  
  /**
   * Test processing latency for all steps
   */
  async testProcessingLatency(): Promise<ProcessingLatencyMetrics> {
    console.log('⚙️ Testing Processing Latency...');
    
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
      
      this.logResults(metrics);
      return metrics;
      
    } catch (error) {
      console.error('❌ Processing latency test failed:', error);
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
    return endTime - startTime;
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
    
    return {
      dataExtractionTime: endTime - startTime,
      pedestrians
    };
  }
  
  /**
   * Test 3: Measure crosswalk detection time
   */
  private measureCrosswalkDetection(pedestrians: any[]): number {
    if (pedestrians.length === 0) return 0;
    
    const startTime = performance.now();
    
    // Run crosswalk detection for all pedestrians (this is what we're measuring)
    let pedestriansInCrosswalk = 0;
    for (const pedestrian of pedestrians) {
      if (CrosswalkDetectionService.isInCrosswalk(pedestrian.coordinates)) {
        pedestriansInCrosswalk++;
      }
    }
    
    const endTime = performance.now();
    
    console.log(`   Crosswalk check: ${pedestriansInCrosswalk}/${pedestrians.length} pedestrians in crosswalk`);
    return endTime - startTime;
  }
  
  /**
   * Test 4: Measure proximity detection time
   */
  private measureProximityDetection(pedestrians: any[]): number {
    if (pedestrians.length === 0) return 0;
    
    // Use a sample vehicle position for testing
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
    
    console.log(`   Proximity check: ${nearbyPedestrians}/${pedestrians.length} pedestrians near vehicle`);
    return endTime - startTime;
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
   * Log processing latency results
   */
  private logResults(metrics: ProcessingLatencyMetrics): void {
    console.log('\n⚙️ PROCESSING LATENCY TEST RESULTS:');
    console.log('=====================================');
    console.log(`Total Processing Time: ${metrics.totalProcessingTime.toFixed(2)}ms`);
    console.log(`JSON Parsing: ${metrics.jsonParsingTime.toFixed(2)}ms`);
    console.log(`Data Extraction: ${metrics.dataExtractionTime.toFixed(2)}ms`);
    console.log(`Crosswalk Detection: ${metrics.crosswalkDetectionTime.toFixed(2)}ms`);
    console.log(`Proximity Detection: ${metrics.proximityDetectionTime.toFixed(2)}ms`);
    console.log(`Pedestrians Processed: ${metrics.pedestrianCount}`);
    
    // Performance breakdown
    if (metrics.totalProcessingTime > 0) {
      const jsonPercent = (metrics.jsonParsingTime / metrics.totalProcessingTime * 100).toFixed(1);
      const extractionPercent = (metrics.dataExtractionTime / metrics.totalProcessingTime * 100).toFixed(1);
      const crosswalkPercent = (metrics.crosswalkDetectionTime / metrics.totalProcessingTime * 100).toFixed(1);
      const proximityPercent = (metrics.proximityDetectionTime / metrics.totalProcessingTime * 100).toFixed(1);
      
      console.log('\nProcessing Breakdown:');
      console.log(`JSON Parsing: ${jsonPercent}%`);
      console.log(`Data Extraction: ${extractionPercent}%`);
      console.log(`Crosswalk Detection: ${crosswalkPercent}%`);
      console.log(`Proximity Detection: ${proximityPercent}%`);
    }
    
    console.log('=====================================\n');
  }
}