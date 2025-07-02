// app/src/features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { CROSSWALK_POLYGON_COORDS } from '../../Crosswalk/constants/CrosswalkCoordinates';

// Distance threshold in coordinate units (approximately 10 meters or less)
const PROXIMITY_WARNING_DISTANCE = 0.0003; 

export interface PedestrianData {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
  timestamp: string;
  heading?: number;
  speed?: number;
}

// Define the expected API response structure
interface SDSMApiResponse {
  intersectionID: string;
  intersection: string;
  timestamp: string;
  objects: Array<{
    objectID: number;
    type: 'vehicle' | 'vru';
    timestamp: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    heading?: number;
    speed?: number;
    size?: {
      width: number | null;
      length: number | null;
    };
  }>;
}

export class PedestrianDetectorViewModel {
  isMonitoring: boolean = false;
  pedestriansInCrosswalk: number = 0;
  pedestrians: PedestrianData[] = [];
  
  // User's position (will be used as vehicle)
  private _vehiclePosition: [number, number] = [0, 0];
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 1500; // Check every 2 seconds for real data
  
  constructor() {
    makeAutoObservable(this);
    console.log('PedestrianDetectorViewModel: Initialized with real SDSM data');
  }
  
  // Getter for vehicle position
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  
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
    
    console.log('Starting real-time pedestrian monitoring...');
    this.isMonitoring = true;
    
    // Fetch data immediately
    this.fetchAndUpdatePedestrianData();
    
    // Set up periodic updates
    this.monitoringInterval = setInterval(() => {
      this.fetchAndUpdatePedestrianData();
    }, this.updateFrequency);
  });
  
  stopMonitoring = action("stopMonitoring", (): void => {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('Stopped pedestrian monitoring');
  });
  
  /**
   * Fetch real pedestrian data from SDSM API
   */
  private async fetchAndUpdatePedestrianData(): Promise<void> {
    try {
      const url = 'http://10.199.1.11:9095/latest/sdsm_events';
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`SDSM API error: ${response.status}`);
        return;
      }
      
      const rawData: SDSMApiResponse = await response.json();
      
      if (rawData && rawData.objects && Array.isArray(rawData.objects)) {
        // Filter for VRU (pedestrian) objects only
        const pedestrianObjects = rawData.objects.filter(obj => obj.type === 'vru');
        
        console.log(`Found ${pedestrianObjects.length} pedestrians in SDSM data`);
        
        // Convert to our pedestrian data format
        const pedestrianData: PedestrianData[] = pedestrianObjects.map(obj => ({
          id: obj.objectID,
          coordinates: obj.location.coordinates, // [lat, lon]
          timestamp: obj.timestamp,
          heading: obj.heading,
          speed: obj.speed
        }));
        
        // Update pedestrian data
        runInAction(() => {
          this.pedestrians = pedestrianData;
        });
        
        // Check conditions with new data
        this.checkConditions();
      } else {
        console.warn('No valid objects array in SDSM data');
        runInAction(() => {
          this.pedestrians = [];
          this.pedestriansInCrosswalk = 0;
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('SDSM API request timed out');
      } else {
        console.error('Error fetching SDSM data:', error);
      }
      // Don't clear existing data on error, just log it
    }
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
      console.error('Error checking if point is in crosswalk:', error);
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
   * Check if the vehicle is close to a specific position (10 meters or less)
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
      
      return distance <= PROXIMITY_WARNING_DISTANCE;
    } catch (error) {
      console.error('Error checking if vehicle is close to pedestrian:', error);
      return false;
    }
  }
  
  /**
   * Check conditions and update crosswalk count
   */
  checkConditions(): void {
    let pedestriansInCrosswalkCount = 0;
    let hasCloseVehicle = false;
    
    // Check each pedestrian
    this.pedestrians.forEach(pedestrian => {
      const isInCrosswalk = this.isPointInCrosswalk(pedestrian.coordinates);
      const isCloseToVehicle = this.isVehicleCloseToPosition(pedestrian.coordinates);
      
      if (isInCrosswalk) {
        pedestriansInCrosswalkCount++;
        console.log(`🚶 Pedestrian ${pedestrian.id} is in crosswalk at [${pedestrian.coordinates[0]}, ${pedestrian.coordinates[1]}]`);
      }
      
      if (isCloseToVehicle) {
        hasCloseVehicle = true;
        const distance = this.distanceBetweenPoints(
          pedestrian.coordinates[0], pedestrian.coordinates[1],
          this._vehiclePosition[0], this._vehiclePosition[1]
        ) * 100000; // Convert to approximate meters
        
        console.log(`🚗 Vehicle is ${distance.toFixed(2)}m from pedestrian ${pedestrian.id}`);
      }
      
      // Log warning if both conditions are met
      if (isInCrosswalk && isCloseToVehicle) {
        const distance = this.distanceBetweenPoints(
          pedestrian.coordinates[0], pedestrian.coordinates[1],
          this._vehiclePosition[0], this._vehiclePosition[1]
        ) * 100000;
        
        console.log(`\n🔴 WARNING: Pedestrian ${pedestrian.id} is crossing and vehicle is approaching (${distance.toFixed(2)} meters away)!`);
      }
    });
    
    // Update the observable state
    runInAction(() => {
      this.pedestriansInCrosswalk = pedestriansInCrosswalkCount;
    });
    
    console.log(`📊 Status: ${pedestriansInCrosswalkCount} pedestrians in crosswalk, vehicle proximity: ${hasCloseVehicle}`);
  }
  
  cleanup = action("cleanup", (): void => {
    this.stopMonitoring();
    console.log('PedestrianDetectorViewModel: Cleaned up');
  });
}