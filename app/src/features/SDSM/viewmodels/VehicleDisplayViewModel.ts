// app/src/features/SDSM/viewmodels/VehicleDisplayViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { VehicleInfo } from '../models/SDSMData';

export class VehicleDisplayViewModel {
  // Observable state
  vehicles: VehicleInfo[] = [];
  isActive: boolean = false;
  lastUpdateTime: number = 0;
  updateCount: number = 0;
  error: string | null = null;
  
  // Private properties
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly API_URL = 'http://10.199.1.11:9095/latest/sdsm_events';
  private readonly UPDATE_FREQUENCY = 1000; // 1 second
  private readonly REQUEST_TIMEOUT = 3000; // 3 seconds
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Start real-time vehicle tracking
   */
  start(): void {
    if (this.isActive) return;
    
    runInAction(() => {
      this.isActive = true;
      this.error = null;
      this.updateCount = 0;
    });
    
    // Fetch immediately
    this.fetchVehicles();
    
    // Set up interval
    this.updateInterval = setInterval(() => {
      this.fetchVehicles();
    }, this.UPDATE_FREQUENCY);
  }
  
  /**
   * Stop vehicle tracking
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    runInAction(() => {
      this.isActive = false;
      this.vehicles = [];
    });
  }
  
  /**
   * Fetch vehicles from API
   */
  private async fetchVehicles(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const rawData = await response.json();
      const vehicles = this.extractVehicles(rawData);
      
      runInAction(() => {
        this.vehicles = vehicles;
        this.lastUpdateTime = Date.now();
        this.updateCount++;
        this.error = null;
      });
      
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }
  
  /**
   * Extract vehicles from API response
   */
  private extractVehicles(data: any): VehicleInfo[] {
    if (!data?.objects || !Array.isArray(data.objects)) {
      return [];
    }
    
    return data.objects
      .filter((obj: any) => obj.type === 'vehicle')
      .map((obj: any) => ({
        id: obj.objectID,
        coordinates: obj.location?.coordinates || [0, 0],
        timestamp: obj.timestamp,
        heading: obj.heading,
        speed: obj.speed,
        size: obj.size
      }))
      .filter((vehicle: VehicleInfo) => 
        vehicle.coordinates[0] !== 0 && vehicle.coordinates[1] !== 0
      );
  }
  
  /**
   * Convert coordinates for Mapbox
   */
  getMapboxCoordinates(vehicle: VehicleInfo): [number, number] {
    const [lat, lng] = vehicle.coordinates;
    return [lng, lat]; // Mapbox expects [longitude, latitude]
  }
  
  /**
   * Get vehicle count
   */
  get vehicleCount(): number {
    return this.vehicles.length;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
  }
}