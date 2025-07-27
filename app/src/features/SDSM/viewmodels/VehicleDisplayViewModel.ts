// app/src/features/SDSM/viewmodels/VehicleDisplayViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { VehicleInfo } from '../models/SDSMData';
import { SDSMService } from '../services/SDSMService';

export class VehicleDisplayViewModel {
  // Observable state
  vehicles: VehicleInfo[] = [];
  isActive: boolean = false;
  lastUpdateTime: number = 0;
  updateCount: number = 0;
  error: string | null = null;
  
  // Private properties
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly API_URL = 'http://10.199.1.11:9095/latest/mlk_spat_events';
  private readonly UPDATE_FREQUENCY = 100; // 10Hz = 100ms interval
  private readonly REQUEST_TIMEOUT = 1000; // 1 second timeout for low latency
  
  constructor() {
    makeAutoObservable(this);
    console.log('🚗 VehicleDisplayViewModel: Initialized for 10Hz updates');
  }
  
  /**
   * Start real-time vehicle tracking at 10Hz
   */
  start(): void {
    if (this.isActive) return;
    
    console.log('🚗 Starting 10Hz vehicle tracking...');
    
    runInAction(() => {
      this.isActive = true;
      this.error = null;
      this.updateCount = 0;
    });
    
    // Fetch immediately
    this.fetchVehicles();
    
    // Set up 10Hz interval
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
    
    console.log('🚗 Stopped vehicle tracking');
  }
  
  /**
   * Fetch vehicles from SDSM API with low latency
   */
  private async fetchVehicles(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const startTime = performance.now();
      
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
      const fetchTime = performance.now() - startTime;
      
      // Filter only vehicles from the response
      const vehicleObjects = this.filterVehiclesFromResponse(rawData);
      const vehicles = this.convertToVehicleInfo(vehicleObjects);
      
      runInAction(() => {
        this.vehicles = vehicles;
        this.lastUpdateTime = Date.now();
        this.updateCount++;
        this.error = null;
      });
      
      // Log performance every 50 updates (every 5 seconds at 10Hz)
      if (this.updateCount % 50 === 0) {
        console.log(`🚗 Update #${this.updateCount}: ${vehicles.length} vehicles, fetch: ${fetchTime.toFixed(1)}ms`);
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('🚗 Request timeout (>1s)');
      } else {
        console.error('🚗 Fetch error:', error);
      }
      
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
      });
    }
  }
  
  /**
   * Filter only vehicle objects from API response
   */
  private filterVehiclesFromResponse(data: any): any[] {
    if (!data?.objects || !Array.isArray(data.objects)) {
      return [];
    }
    
    return data.objects.filter((obj: any) => obj.type === 'vehicle');
  }
  
  /**
   * Convert raw vehicle objects to VehicleInfo format
   */
  private convertToVehicleInfo(vehicleObjects: any[]): VehicleInfo[] {
    return vehicleObjects.map(obj => ({
      id: obj.objectID,
      coordinates: obj.location?.coordinates || [0, 0],
      timestamp: obj.timestamp,
      heading: obj.heading,
      speed: obj.speed,
      size: obj.size
    }));
  }
  
  /**
   * Convert API coordinates [lat, lng] to Mapbox format [lng, lat]
   */
  getMapboxCoordinates(vehicle: VehicleInfo): [number, number] {
    const [lat, lng] = vehicle.coordinates;
    return [lng, lat];
  }
  
  /**
   * Get vehicle count
   */
  get vehicleCount(): number {
    return this.vehicles.length;
  }
  
  /**
   * Get update frequency in Hz
   */
  get updateFrequency(): number {
    return 1000 / this.UPDATE_FREQUENCY;
  }
  
  /**
   * Get time since last update in ms
   */
  get timeSinceLastUpdate(): number {
    return this.lastUpdateTime > 0 ? Date.now() - this.lastUpdateTime : -1;
  }
  
  /**
   * Check if data is fresh (updated within last 500ms)
   */
  get isDataFresh(): boolean {
    return this.timeSinceLastUpdate < 500;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
    console.log('🚗 VehicleDisplayViewModel: Cleaned up');
  }
}