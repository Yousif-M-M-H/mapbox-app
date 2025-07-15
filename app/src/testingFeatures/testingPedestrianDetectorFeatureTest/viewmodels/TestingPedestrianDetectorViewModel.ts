// app/src/testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { CROSSWALK_POLYGON_COORDS } from '../../../features/Crosswalk/constants/CrosswalkCoordinates';
import { TESTING_CONFIG } from '../../TestingConfig';
import { DetectionZoneEntryTester } from '../../../features/PedestrianDetector/testing/DetectionZoneEntryTester';

const TESTING_PROXIMITY_WARNING_DISTANCE = 0.0003; // ~30 meters for testing

export interface TestingPedestrianData {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
  timestamp: string;
  heading?: number;
  speed?: number;
}

export class TestingPedestrianDetectorViewModel {
  isMonitoring: boolean = false;
  pedestriansInCrosswalk: number = 0;
  pedestrians: TestingPedestrianData[] = [];
  
  private _vehiclePosition: [number, number] = [0, 0];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private detectionZoneEntryTester: DetectionZoneEntryTester;
  private testingInterval: NodeJS.Timeout | null = null;
  
  // Testing simulation state
  private simulationActive: boolean = false;
  private simulationStep: number = 0;
  
  constructor() {
    makeAutoObservable(this);
    
    // Initialize detection zone entry tester for testing mode
    this.detectionZoneEntryTester = new DetectionZoneEntryTester();
    
    this.setupFixedPedestrianData();
    console.log('🧪 TestingPedestrianDetectorViewModel: Initialized with Detection Zone Entry Testing');
  }
  
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  get isVehicleNearPedestrian(): boolean {
    return this.pedestrians.some(pedestrian => 
      this.isVehicleCloseToPosition(pedestrian.coordinates)
    );
  }
  
  setVehiclePosition = action("setVehiclePosition", (position: [number, number]): void => {
    this._vehiclePosition = position;
    this.checkConditions();
    this.updateDetectionZoneEntryTester();
  });
  
  startMonitoring = action("startMonitoring", (): void => {
    if (this.isMonitoring) return;
    
    console.log('🧪 Starting testing mode pedestrian monitoring with zone entry testing...');
    this.isMonitoring = true;
    this.setupFixedPedestrianData();
    
    // Start detection zone entry testing
    this.detectionZoneEntryTester.startTesting();
    
    // Start simulation for testing zone entry/exit
    this.startZoneEntrySimulation();
    
    this.monitoringInterval = setInterval(() => {
      this.checkConditions();
      this.updateDetectionZoneEntryTester();
    }, 2000);
  });
  
  stopMonitoring = action("stopMonitoring", (): void => {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.testingInterval) {
      clearInterval(this.testingInterval);
      this.testingInterval = null;
    }
    
    this.simulationActive = false;
    this.isMonitoring = false;
    
    // Stop detection zone entry testing
    this.detectionZoneEntryTester.stopTesting();
    
    console.log('🧪 Stopped testing mode monitoring');
  });
  
  /**
   * Start zone entry simulation to test the detection timing
   */
  private startZoneEntrySimulation(): void {
    console.log('🎭 Starting zone entry simulation for testing...');
    this.simulationActive = true;
    this.simulationStep = 0;
    
    // Create positions: outside zone → entering zone → inside zone → exiting zone
    const simulationPositions = this.generateSimulationPositions();
    
    this.testingInterval = setInterval(() => {
      if (!this.simulationActive || this.simulationStep >= simulationPositions.length) {
        // Reset simulation
        this.simulationStep = 0;
        console.log('🔄 Restarting zone entry simulation...');
      }
      
      const newPosition = simulationPositions[this.simulationStep];
      this.updatePedestrianPosition(newPosition);
      this.simulationStep++;
      
    }, 3000); // Change position every 3 seconds for clear testing
  }
  
  /**
   * Generate positions for simulation: outside → inside → outside
   */
  private generateSimulationPositions(): [number, number][] {
    return [
      // Position 1: Outside the crosswalk (north of it)
      [35.03979000, -85.29203000], // Outside zone
      
      // Position 2: Approaching the crosswalk edge
      [35.03978000, -85.29203500], // Getting closer
      
      // Position 3: Entering the crosswalk (should trigger zone entry)
      [35.03976900, -85.29204000], // Entering zone
      
      // Position 4: Inside the crosswalk (should be registered)
      [35.03976600, -85.29204500], // Inside zone (original testing position)
      
      // Position 5: Still inside crosswalk
      [35.03976400, -85.29205000], // Still inside
      
      // Position 6: Exiting the crosswalk
      [35.03975800, -85.29205500], // Exiting zone
      
      // Position 7: Outside the crosswalk (south of it)
      [35.03975000, -85.29206000], // Outside zone
    ];
  }
  
  /**
   * Update pedestrian position for simulation
   */
  private updatePedestrianPosition(newPosition: [number, number]): void {
    runInAction(() => {
      if (this.pedestrians.length > 0) {
        const updatedPedestrian: TestingPedestrianData = {
          ...this.pedestrians[0],
          coordinates: newPosition,
          timestamp: new Date().toISOString()
        };
        
        this.pedestrians = [updatedPedestrian];
        
        console.log(`🚶 Simulation: Moving pedestrian to [${newPosition[0].toFixed(6)}, ${newPosition[1].toFixed(6)}]`);
      }
    });
  }
  
  /**
   * Update the detection zone entry tester with current data
   */
  private updateDetectionZoneEntryTester(): void {
    if (!this.detectionZoneEntryTester.isTestingActive()) {
      return;
    }
    
    try {
      // Get current pedestrians
      const currentPedestrians = this.pedestrians.map(p => ({
        id: p.id,
        coordinates: p.coordinates
      }));
      
      // Get pedestrians that are registered (in crosswalk)
      const registeredPedestrianIds = this.getRegisteredPedestrianIds();
      
      // Feed data to the tester
      this.detectionZoneEntryTester.processPedestrianUpdate(
        currentPedestrians,
        registeredPedestrianIds
      );
      
    } catch (error) {
      console.error('🧪 Error updating detection zone entry tester:', error);
    }
  }
  
  /**
   * Get IDs of pedestrians currently registered (in crosswalk)
   */
  private getRegisteredPedestrianIds(): number[] {
    return this.pedestrians
      .filter(p => this.isPointInCrosswalk(p.coordinates))
      .map(p => p.id);
  }
  
  /**
   * Get pedestrians currently in crosswalk (for external API compatibility)
   */
  getPedestriansInCrosswalk(): TestingPedestrianData[] {
    return this.pedestrians.filter(p => this.isPointInCrosswalk(p.coordinates));
  }
  
  private setupFixedPedestrianData(): void {
    const fixedPedestrianData: TestingPedestrianData = {
      id: 99999,
      coordinates: TESTING_CONFIG.FIXED_PEDESTRIAN_COORDINATES,
      timestamp: new Date().toISOString(),
      heading: 0,
      speed: 0
    };
    
    runInAction(() => {
      this.pedestrians = [fixedPedestrianData];
    });
    
    console.log('🧪 Fixed pedestrian data setup for detection zone testing');
  }
  
  private distanceBetweenPoints(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) + 
      Math.pow(lon2 - lon1, 2)
    );
  }
  
  private isPointInCrosswalk(coordinates: [number, number]): boolean {
    try {
      return this.isPointInPolygon(coordinates, CROSSWALK_POLYGON_COORDS);
    } catch (error) {
      return false;
    }
  }

  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [pointLat, pointLng] = point; // GPS: [lat, lng]
    let inside = false;
    
    // Convert polygon from [lng, lat] to [lat, lng] for comparison
    const vertices: [number, number][] = polygon.map(([lng, lat]) => [lat, lng]);
    
    // Handle closed polygon (remove duplicate last point if exists)
    const cleanVertices = vertices.length > 0 && 
                         vertices[0][0] === vertices[vertices.length-1][0] && 
                         vertices[0][1] === vertices[vertices.length-1][1] ? 
                         vertices.slice(0, -1) : vertices;
    
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
  
  private isVehicleCloseToPosition(pedestrianPosition: [number, number]): boolean {
    try {
      const distance = this.distanceBetweenPoints(
        pedestrianPosition[0], pedestrianPosition[1], 
        this._vehiclePosition[0], this._vehiclePosition[1]
      );
      
      return distance <= TESTING_PROXIMITY_WARNING_DISTANCE;
    } catch (error) {
      return false;
    }
  }
  
  checkConditions(): void {
    let pedestriansInCrosswalkCount = 0;
    
    this.pedestrians.forEach(pedestrian => {
      const isInCrosswalk = this.isPointInCrosswalk(pedestrian.coordinates);
      
      if (isInCrosswalk) {
        pedestriansInCrosswalkCount++;
      }
    });
    
    runInAction(() => {
      this.pedestriansInCrosswalk = pedestriansInCrosswalkCount;
    });
  }
  
  /**
   * Manual trigger for testing - force pedestrian to enter zone
   */
  triggerZoneEntry(): void {
    console.log('🧪 Manual trigger: Forcing pedestrian to enter detection zone...');
    this.updatePedestrianPosition([35.03976600, -85.29204500]); // Inside crosswalk
  }
  
  /**
   * Manual trigger for testing - force pedestrian to exit zone  
   */
  triggerZoneExit(): void {
    console.log('🧪 Manual trigger: Forcing pedestrian to exit detection zone...');
    this.updatePedestrianPosition([35.03979000, -85.29203000]); // Outside crosswalk
  }
  
  /**
   * Get detection zone entry testing status
   */
  get isDetectionZoneTestingActive(): boolean {
    return this.detectionZoneEntryTester.isTestingActive();
  }
  
  /**
   * Get current detection zone entry metrics
   */
  getDetectionZoneMetrics() {
    return this.detectionZoneEntryTester.getMetrics();
  }
  
  cleanup = action("cleanup", (): void => {
    this.stopMonitoring();
    
    // Cleanup detection zone entry tester
    try {
      this.detectionZoneEntryTester.stopTesting();
    } catch (error) {
      console.error('🧪 Error cleaning up detection zone entry tester:', error);
    }
    
    console.log('🧪 TestingPedestrianDetectorViewModel: Cleaned up');
  });
}