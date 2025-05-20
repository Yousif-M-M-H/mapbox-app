// app/src/features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { CROSSWALK_POLYGON_COORDS } from '../../Crosswalk/constants/CrosswalkCoordinates';

// Fixed pedestrian position for testing
const FIXED_PEDESTRIAN: [number, number] = [35.03976921170768, -85.29207881999284]; // [lat, lon]

// Distance threshold in coordinate units (approximately 10 meters)
const PROXIMITY_WARNING_DISTANCE = 0.0001; 

export interface PedestrianData {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
}

export class PedestrianDetectorViewModel {
  isMonitoring: boolean = false;
  pedestriansInCrosswalk: number = 0;
  pedestrians: PedestrianData[] = [];
  
  // Fixed pedestrian position
  pedestrianPosition: [number, number] = FIXED_PEDESTRIAN;
  
  // User's position (will be used as vehicle)
  private _vehiclePosition: [number, number] = [0, 0]; // Default value, will be updated
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 500; // Refresh twice per second
  
  constructor() {
    makeAutoObservable(this);
    console.log(`Fixed pedestrian position: [${FIXED_PEDESTRIAN[0]}, ${FIXED_PEDESTRIAN[1]}]`);
  }
  
  // Getter for vehicle position
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  // Getter to check if vehicle is near pedestrian - used by UI
  get isVehicleNearPedestrian(): boolean {
    return this.isVehicleCloseToVehicle();
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
    this.checkConditions();
    this.monitoringInterval = setInterval(() => {
      this.checkConditions();
    }, this.updateFrequency);
    this.isMonitoring = true;
  });
  
  stopMonitoring = action("stopMonitoring", (): void => {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  });
  
  updatePedestrians = action("updatePedestrians", 
    (pedestrians: PedestrianData[], crosswalkCount: number): void => {
      this.pedestrians = pedestrians;
      this.pedestriansInCrosswalk = crosswalkCount;
    }
  );
  
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
      console.error('Error checking if point is in crosswalk:', error);
      return false;
    }
  }

  /**
   * Ray casting algorithm to determine if a point is inside a polygon
   */
  private isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    // For point [lat, lon] and polygon vertices as [lon, lat]
    const x = point[0], y = point[1];
    let inside = false;
    
    // Need to remove the last point if it's the same as the first (closing point)
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
   * Check if the vehicle is close to the pedestrian
   */
  private isVehicleCloseToVehicle(): boolean {
    try {
      const pedestrianLat = this.pedestrianPosition[0];
      const pedestrianLon = this.pedestrianPosition[1];
      
      const vehicleLat = this._vehiclePosition[0];
      const vehicleLon = this._vehiclePosition[1];
      
      const distance = this.distanceBetweenPoints(
        pedestrianLat, pedestrianLon, 
        vehicleLat, vehicleLon
      );
      
      return distance < PROXIMITY_WARNING_DISTANCE;
    } catch (error) {
      console.error('Error checking if vehicle is close to pedestrian:', error);
      return false;
    }
  }
  
  /**
   * Check conditions and log warning if needed
   */
  checkConditions(): void {
    const isInCrosswalk = this.isPointInCrosswalk(this.pedestrianPosition);
    const isCloseToVehicle = this.isVehicleCloseToVehicle();
    
    // Calculate distance in meters (rough approximation)
    const distance = this.distanceBetweenPoints(
      this.pedestrianPosition[0], this.pedestrianPosition[1],
      this._vehiclePosition[0], this._vehiclePosition[1]
    ) * 100000;
    
    // Create pedestrian data
    const pedestrianData: PedestrianData = {
      id: 9999,
      coordinates: this.pedestrianPosition
    };
    
    // Update pedestrians array and crosswalk count
    this.updatePedestrians(
      [pedestrianData], 
      isInCrosswalk ? 1 : 0
    );
    
    // Add specific log for crosswalk detection
    if (isInCrosswalk) {
      console.log(`🚶 CROSSWALK DETECTION: Pedestrian is within the crosswalk area!`);
    } else {
      console.log(`🚶 CROSSWALK DETECTION: Pedestrian is NOT within the crosswalk area.`);
    }
    
    // Check both conditions for warning
    if (isInCrosswalk && isCloseToVehicle) {
      console.log(`\n🔴 WARNING: Pedestrian is crossing and vehicle is approaching (${distance.toFixed(2)} meters away)!`);
    }
  }
  
  cleanup = action("cleanup", (): void => {
    this.stopMonitoring();
  });
}