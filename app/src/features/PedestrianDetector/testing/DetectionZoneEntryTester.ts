// app/src/features/PedestrianDetector/testing/DetectionZoneEntryTester.ts

import { CROSSWALK_POLYGON_COORDS } from '../../Crosswalk/constants/CrosswalkCoordinates';

interface PedestrianTrackingData {
  id: number;
  coordinates: [number, number];
  zoneEntryTime?: number;
  registrationTime?: number;
  wasInZone: boolean;
  isRegistered: boolean;
}

interface DetectionZoneEntryMetrics {
  pedestrianId: number;
  zoneEntryTime: number;
  registrationTime: number;
  detectionZoneEntryTime: number; // The key metric we're measuring
  coordinates: [number, number];
  timestamp: number;
}

export class DetectionZoneEntryTester {
  private trackedPedestrians = new Map<number, PedestrianTrackingData>();
  private metrics: DetectionZoneEntryMetrics[] = [];
  private isActive: boolean = false;
  
  constructor() {
    console.log('🔍 Detection Zone Entry Tester initialized');
    console.log('📍 Detection Zone: Crosswalk polygon area');
  }
  
  /**
   * Start monitoring pedestrian zone entry times
   */
  startTesting(): void {
    if (this.isActive) {
      console.log('🔍 Detection Zone Entry Testing already active');
      return;
    }
    
    this.isActive = true;
    this.trackedPedestrians.clear();
    this.metrics = [];
    
    console.log('🔍 Started Detection Zone Entry Time testing');
    console.log('📊 Monitoring pedestrian zone entry and registration timing...');
  }
  
  /**
   * Stop testing and log final results
   */
  stopTesting(): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.logFinalResults();
    
    console.log('🔍 Stopped Detection Zone Entry Time testing');
  }
  
  /**
   * Process pedestrian data update - main testing logic
   */
  processPedestrianUpdate(
    currentPedestrians: Array<{ id: number; coordinates: [number, number] }>,
    registeredPedestrianIds: number[]
  ): void {
    if (!this.isActive) return;
    
    const currentTime = performance.now();
    
    // Process each current pedestrian
    for (const pedestrian of currentPedestrians) {
      this.processSinglePedestrian(pedestrian, registeredPedestrianIds, currentTime);
    }
    
    // Clean up pedestrians that are no longer present
    this.cleanupMissingPedestrians(currentPedestrians);
  }
  
  /**
   * Process a single pedestrian for zone entry detection
   */
  private processSinglePedestrian(
    pedestrian: { id: number; coordinates: [number, number] },
    registeredPedestrianIds: number[],
    currentTime: number
  ): void {
    const { id, coordinates } = pedestrian;
    const isInZone = this.isInDetectionZone(coordinates);
    const isRegistered = registeredPedestrianIds.includes(id);
    
    // Get or create tracking data for this pedestrian
    let trackingData = this.trackedPedestrians.get(id);
    if (!trackingData) {
      trackingData = {
        id,
        coordinates,
        wasInZone: isInZone,
        isRegistered: isRegistered,
      };
      this.trackedPedestrians.set(id, trackingData);
    }
    
    // Update current position
    trackingData.coordinates = coordinates;
    
    // Check for zone entry (wasn't in zone, now is in zone)
    if (!trackingData.wasInZone && isInZone) {
      trackingData.zoneEntryTime = currentTime;
      trackingData.wasInZone = true;
      
      console.log(`🚶 Pedestrian ${id} entered detection zone at coordinates [${coordinates[0].toFixed(6)}, ${coordinates[1].toFixed(6)}]`);
    }
    
    // Check for registration (wasn't registered, now is registered)
    if (!trackingData.isRegistered && isRegistered) {
      trackingData.registrationTime = currentTime;
      trackingData.isRegistered = true;
      
      console.log(`📝 Pedestrian ${id} officially registered by system`);
      
      // Calculate detection zone entry time if we have both timestamps
      if (trackingData.zoneEntryTime && trackingData.registrationTime) {
        this.recordDetectionZoneEntryTime(trackingData);
      }
    }
    
    // Update zone status
    trackingData.wasInZone = isInZone;
  }
  
  /**
   * Record the detection zone entry time metric
   */
  private recordDetectionZoneEntryTime(trackingData: PedestrianTrackingData): void {
    if (!trackingData.zoneEntryTime || !trackingData.registrationTime) return;
    
    const detectionZoneEntryTime = trackingData.registrationTime - trackingData.zoneEntryTime;
    
    const metric: DetectionZoneEntryMetrics = {
      pedestrianId: trackingData.id,
      zoneEntryTime: trackingData.zoneEntryTime,
      registrationTime: trackingData.registrationTime,
      detectionZoneEntryTime,
      coordinates: trackingData.coordinates,
      timestamp: Date.now()
    };
    
    this.metrics.push(metric);
    
    // Log the measurement
    console.log(`\n⏱️ DETECTION ZONE ENTRY TIME MEASURED:`);
    console.log(`   Pedestrian ID: ${trackingData.id}`);
    console.log(`   Zone Entry Time: ${trackingData.zoneEntryTime.toFixed(2)}ms`);
    console.log(`   Registration Time: ${trackingData.registrationTime.toFixed(2)}ms`);
    console.log(`   🎯 Detection Zone Entry Time: ${detectionZoneEntryTime.toFixed(2)}ms`);
    console.log(`   Coordinates: [${trackingData.coordinates[0].toFixed(6)}, ${trackingData.coordinates[1].toFixed(6)}]`);
    console.log(`───────────────────────────────────────────────────────\n`);
  }
  
  /**
   * Check if coordinates are within the detection zone (crosswalk polygon)
   */
  private isInDetectionZone(coordinates: [number, number]): boolean {
    return this.isPointInPolygon(coordinates, CROSSWALK_POLYGON_COORDS);
  }
  
  /**
   * Point-in-polygon detection using ray casting algorithm
   */
  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [pointLat, pointLng] = point;
    let inside = false;
    
    // Convert polygon from [lng, lat] to [lat, lng] for comparison
    const vertices: [number, number][] = polygon.map(([lng, lat]) => [lat, lng]);
    
    // Remove duplicate last point if it exists (closed polygon)
    const cleanVertices = this.ensureOpenPolygon(vertices);
    
    // Ray casting algorithm
    for (let i = 0, j = cleanVertices.length - 1; i < cleanVertices.length; j = i++) {
      const [latI, lngI] = cleanVertices[i];
      const [latJ, lngJ] = cleanVertices[j];
      
      if (((latI > pointLat) !== (latJ > pointLat)) &&
        (pointLng < (lngJ - lngI) * (pointLat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  /**
   * Ensure polygon is open (remove duplicate last point if it matches first)
   */
  private ensureOpenPolygon(vertices: [number, number][]): [number, number][] {
    if (vertices.length > 0 && 
        vertices[0][0] === vertices[vertices.length - 1][0] && 
        vertices[0][1] === vertices[vertices.length - 1][1]) {
      return vertices.slice(0, -1);
    }
    return vertices;
  }
  
  /**
   * Clean up tracking data for pedestrians that are no longer present
   */
  private cleanupMissingPedestrians(currentPedestrians: Array<{ id: number; coordinates: [number, number] }>): void {
    const currentIds = new Set(currentPedestrians.map(p => p.id));
    
    for (const [id, trackingData] of this.trackedPedestrians) {
      if (!currentIds.has(id)) {
        // Pedestrian is no longer present, clean up
        this.trackedPedestrians.delete(id);
        console.log(`🚶‍♂️ Pedestrian ${id} left detection area - cleaning up tracking data`);
      }
    }
  }
  
  /**
   * Log final testing results and statistics
   */
  private logFinalResults(): void {
    console.log('\n🔍 DETECTION ZONE ENTRY TIME TEST RESULTS:');
    console.log('=========================================');
    
    if (this.metrics.length === 0) {
      console.log('📊 No complete measurements recorded');
      console.log('   (Pedestrians may not have completed the full entry->registration cycle)');
    } else {
      const times = this.metrics.map(m => m.detectionZoneEntryTime);
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);
      
      console.log(`📊 Total Measurements: ${this.metrics.length}`);
      console.log(`⏱️ Average Detection Zone Entry Time: ${averageTime.toFixed(2)}ms`);
      console.log(`🚀 Fastest Detection: ${minTime.toFixed(2)}ms`);
      console.log(`🐌 Slowest Detection: ${maxTime.toFixed(2)}ms`);
      
      // Log each individual measurement
      console.log('\n📋 Individual Measurements:');
      this.metrics.forEach((metric, index) => {
        console.log(`   ${index + 1}. Pedestrian ${metric.pedestrianId}: ${metric.detectionZoneEntryTime.toFixed(2)}ms`);
      });
    }
    
    console.log('=========================================');
    console.log('🎯 Detection Zone Entry Time testing completed');
    console.log('=========================================\n');
  }
  
  /**
   * Get current testing status
   */
  isTestingActive(): boolean {
    return this.isActive;
  }
  
  /**
   * Get current metrics for external analysis
   */
  getMetrics(): DetectionZoneEntryMetrics[] {
    return [...this.metrics]; // Return copy to prevent external modification
  }
  
  /**
   * Clear all collected data
   */
  clearData(): void {
    this.trackedPedestrians.clear();
    this.metrics = [];
    console.log('🔍 Detection Zone Entry Tester data cleared');
  }
}