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
  private readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events';
  private readonly POLL_FREQUENCY = 100; // Poll API every 100ms for new messages
  private readonly REQUEST_TIMEOUT = 3000; // 3 seconds
  private lastMessageTimestamp: string | null = null;
  private vehicleMap: Map<number, VehicleInfo> = new Map();
  
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
      this.vehicleMap.clear();
    });
    
    // Start polling for new messages
    this.startPolling();
  }
  
  /**
   * Start polling for new SDSM messages
   */
  private startPolling(): void {
    this.updateInterval = setInterval(() => {
      this.fetchVehicles();
    }, this.POLL_FREQUENCY);
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
      this.vehicleMap.clear();
      this.lastMessageTimestamp = null;
    });
  }
  
  /**
   * Fetch vehicles from API - only update on new messages
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
      
      // Check if this is a new message by timestamp
      if (rawData.timestamp && rawData.timestamp !== this.lastMessageTimestamp) {
        this.lastMessageTimestamp = rawData.timestamp;
        this.updateVehicleState(rawData);
      }
      // If timestamp is same, do nothing - preserve current state
      
    } catch (error) {
      // Silently ignore errors to avoid console spam during frequent polling
      if (error instanceof Error && error.name !== 'AbortError') {
        runInAction(() => {
          this.error = error.message;
        });
      }
    }
  }
  
  /**
   * Update vehicle state with new SDSM data
   */
  private updateVehicleState(data: any): void {
    const newVehicles = this.extractVehicles(data);
    
    // Update vehicle map with new positions
    newVehicles.forEach(vehicle => {
      this.vehicleMap.set(vehicle.id, vehicle);
    });
    
    // Remove vehicles that are no longer in the data
    const currentVehicleIds = new Set(newVehicles.map(v => v.id));
    const keysToDelete: number[] = [];
    this.vehicleMap.forEach((_, id) => {
      if (!currentVehicleIds.has(id)) {
        keysToDelete.push(id);
      }
    });
    keysToDelete.forEach(id => this.vehicleMap.delete(id));
    
    // Update observable array
    runInAction(() => {
      this.vehicles = Array.from(this.vehicleMap.values());
      this.lastUpdateTime = Date.now();
      this.updateCount++;
      this.error = null;
    });
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