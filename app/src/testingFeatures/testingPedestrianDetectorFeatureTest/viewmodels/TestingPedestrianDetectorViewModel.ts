// app/src/testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { CROSSWALK_POLYGON_COORDS } from '../../../features/Crosswalk/constants/CrosswalkCoordinates';

// Distance threshold in coordinate units (approximately 30 meters for testing)
const TESTING_PROXIMITY_WARNING_DISTANCE = 0.0003; // ~30 meters (3x the original 10m)

// Fixed pedestrian position for testing (lon, lat format from API)
const FIXED_PEDESTRIAN_POSITION: [number, number] = [35.0397679634207, -85.29206534467777]; // [lat, lon]

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
  
  // User's position (will be used as vehicle)
  private _vehiclePosition: [number, number] = [0, 0];
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 2000; // Check every 2 seconds
  
  constructor() {
    makeAutoObservable(this);
    console.log('🧪 TESTING PedestrianDetectorViewModel: Initialized with 30-meter threshold and FIXED pedestrian position');
    console.log(`🧪 TESTING: Fixed pedestrian at [${FIXED_PEDESTRIAN_POSITION[0]}, ${FIXED_PEDESTRIAN_POSITION[1]}]`);
  }
  
  // Getter for vehicle position
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  // Getter to check if vehicle is near any pedestrian (30 meters or less for testing)
  get isVehicleNearPedestrian(): boolean {
    return this.pedestrians.some(pedestrian => 
      this.isVehicleCloseToPosition(pedestrian.coordinates)
    );
  }
  
  // Setter for vehicle position - called when user's location updates
  setVehiclePosition = action("setVehiclePosition", (position: [number, number]): void => {
    this._vehiclePosition = position;
    
    // Check conditions immediately when position updates
    if (this.isMonitoring) {
      this.checkConditions();
    }
  });
  
  startMonitoring = action("startMonitoring", (): void => {
    if (this.isMonitoring) return;
    
    console.log('🧪 TESTING: Starting monitoring with FIXED pedestrian position (no API calls)...');
    this.isMonitoring = true;
    
    // Set up the fixed pedestrian data immediately
    this.setupFixedPedestrianData();
    
    // Set up periodic condition checks (no API calls)
    this.monitoringInterval = setInterval(() => {
      this.checkConditions();
    }, this.updateFrequency);
  });
  
  stopMonitoring = action("stopMonitoring", (): void => {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🧪 TESTING: Stopped pedestrian monitoring');
  });
  
  /**
   * Set up fixed pedestrian data (no API calls for testing)
   */
  private setupFixedPedestrianData(): void {
    const fixedPedestrianData: TestingPedestrianData = {
      id: 99999, // Fixed test ID
      coordinates: FIXED_PEDESTRIAN_POSITION, // [lat, lon]
      timestamp: new Date().toISOString(),
      heading: 0,
      speed: 0
    };
    
    runInAction(() => {
      this.pedestrians = [fixedPedestrianData];
    });
    
    console.log('🧪 TESTING: Fixed pedestrian data set up');
    console.log(`🧪 TESTING: Pedestrian ${fixedPedestrianData.id} at [${fixedPedestrianData.coordinates[0]}, ${fixedPedestrianData.coordinates[1]}]`);
    
    // Check conditions with the fixed data
    this.checkConditions();
  }
  
  /**
   * Simple distance calculation between two points
   */
  private distanceBetweenPoints(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) + 
      Math.pow(lon2 - lon1, 2)
    );
  }
  
  /**
   * Check if a point is inside the crosswalk polygon
   */
  private isPointInCrosswalk(coordinates: [number, number]): boolean {
    try {
      const point = coordinates;
      const polygon = CROSSWALK_POLYGON_COORDS;
      
      return this.isPointInPolygon(point, polygon);
    } catch (error) {
      console.error('🧪 TESTING: Error checking if point is in crosswalk:', error);
      return false;
    }
  }

  /**
   * Ray casting algorithm to determine if a point is inside a polygon
   */
  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const x = point[0], y = point[1];
    let inside = false;
    
    const vertices = polygon.length > 0 && polygon[0][0] === polygon[polygon.length-1][0] && 
                    polygon[0][1] === polygon[polygon.length-1][1] ? 
                    polygon.slice(0, -1) : polygon;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i][1], yi = vertices[i][0]; // Note the swap: [lon, lat] to [lat, lon]
      const xj = vertices[j][1], yj = vertices[j][0];
      
      const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    
    return inside;
  }
  
  /**
   * Check if the vehicle is close to a specific position (30 meters or less for testing)
   */
  private isVehicleCloseToPosition(pedestrianPosition: [number, number]): boolean {
    try {
      const pedestrianLat = pedestrianPosition[0];
      const pedestrianLon = pedestrianPosition[1];
      
      const vehicleLat = this._vehiclePosition[0];
      const vehicleLon = this._vehiclePosition[1];
      
      const distance = this.distanceBetweenPoints(
        pedestrianLat, pedestrianLon, 
        vehicleLat, vehicleLon
      );
      
      return distance <= TESTING_PROXIMITY_WARNING_DISTANCE;
    } catch (error) {
      console.error('🧪 TESTING: Error checking if vehicle is close to pedestrian:', error);
      return false;
    }
  }
  
  /**
   * Check conditions and update crosswalk count
   */
  checkConditions(): void {
    let pedestriansInCrosswalkCount = 0;
    let hasCloseVehicle = false;
    
    // Check each pedestrian (just the fixed one for testing)
    this.pedestrians.forEach(pedestrian => {
      const isInCrosswalk = this.isPointInCrosswalk(pedestrian.coordinates);
      const isCloseToVehicle = this.isVehicleCloseToPosition(pedestrian.coordinates);
      
      if (isInCrosswalk) {
        pedestriansInCrosswalkCount++;
        console.log(`🧪 TESTING: 🚶 Fixed Pedestrian ${pedestrian.id} is in crosswalk at [${pedestrian.coordinates[0]}, ${pedestrian.coordinates[1]}]`);
      }
      
      if (isCloseToVehicle) {
        hasCloseVehicle = true;
        const distance = this.distanceBetweenPoints(
          pedestrian.coordinates[0], pedestrian.coordinates[1],
          this._vehiclePosition[0], this._vehiclePosition[1]
        ) * 100000; // Convert to approximate meters
        
        console.log(`🧪 TESTING: 🚗 Vehicle is ${distance.toFixed(2)}m from fixed pedestrian ${pedestrian.id} (30m threshold)`);
      }
      
      // Log warning if both conditions are met
      if (isInCrosswalk && isCloseToVehicle) {
        const distance = this.distanceBetweenPoints(
          pedestrian.coordinates[0], pedestrian.coordinates[1],
          this._vehiclePosition[0], this._vehiclePosition[1]
        ) * 100000;
        
        console.log(`\n🧪 TESTING: 🔴 WARNING: Fixed Pedestrian ${pedestrian.id} is crossing and vehicle is within 30 meters (${distance.toFixed(2)} meters away)!`);
      }
    });
    
    // Update the observable state
    runInAction(() => {
      this.pedestriansInCrosswalk = pedestriansInCrosswalkCount;
    });
    
    console.log(`🧪 TESTING: 📊 Status: ${pedestriansInCrosswalkCount} pedestrians in crosswalk, vehicle proximity (30m): ${hasCloseVehicle}`);
  }
  
  cleanup = action("cleanup", (): void => {
    this.stopMonitoring();
    console.log('🧪 TESTING: PedestrianDetectorViewModel cleaned up');
  });
}