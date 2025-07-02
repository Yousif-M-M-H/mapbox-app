// app/src/testingFeatures/testingPedestrianDetectorFeatureTest/viewmodels/TestingPedestrianDetectorViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { CROSSWALK_POLYGON_COORDS } from '../../../features/Crosswalk/constants/CrosswalkCoordinates';
import { TESTING_CONFIG } from '../../TestingConfig';

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
  
  constructor() {
    makeAutoObservable(this);
    this.setupFixedPedestrianData();
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
  });
  
  startMonitoring = action("startMonitoring", (): void => {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.setupFixedPedestrianData();
    
    this.monitoringInterval = setInterval(() => {
      this.checkConditions();
    }, 2000);
  });
  
  stopMonitoring = action("stopMonitoring", (): void => {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  });
  
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
    const x = point[0], y = point[1];
    let inside = false;
    
    const vertices = polygon.length > 0 && polygon[0][0] === polygon[polygon.length-1][0] && 
                    polygon[0][1] === polygon[polygon.length-1][1] ? 
                    polygon.slice(0, -1) : polygon;
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const xi = vertices[i][1], yi = vertices[i][0];
      const xj = vertices[j][1], yj = vertices[j][0];
      
      const intersect = ((yi > y) !== (yj > y)) &&
          (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
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
  
  cleanup = action("cleanup", (): void => {
    this.stopMonitoring();
  });
}