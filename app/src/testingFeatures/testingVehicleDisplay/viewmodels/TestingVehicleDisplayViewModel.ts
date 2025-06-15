// app/src/testingFeatures/testingVehicleDisplay/viewmodels/TestingVehicleDisplayViewModel.ts
import { makeAutoObservable, action, runInAction } from 'mobx';
import { VehicleData } from '../models/VehicleData';

export class TestingVehicleDisplayViewModel {
  vehicles: VehicleData[] = [];
  isActive: boolean = false;
  lastUpdateTime: string = '';
  
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY = 1000; // 1 second
  private readonly API_URL = 'http://10.199.1.11:9095/latest/sdsm_events';
  
  constructor() {
    makeAutoObservable(this);
    console.log('🚗 TestingVehicleDisplayViewModel: Initialized');
  }
  
  start = action("start", (): void => {
    if (this.isActive) return;
    
    console.log('🚗 Starting vehicle tracking...');
    this.isActive = true;
    
    // Fetch immediately
    this.fetchVehicles();
    
    // Set up interval for updates
    this.updateInterval = setInterval(() => {
      this.fetchVehicles();
    }, this.UPDATE_FREQUENCY);
  });
  
  stop = action("stop", (): void => {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isActive = false;
    console.log('🚗 Stopped vehicle tracking');
  });
  
  /**
   * Fetch vehicles from SDSM API
   */
  private async fetchVehicles(): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`🚗 SDSM API error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data && data.objects && Array.isArray(data.objects)) {
        // Filter for vehicles only
        const vehicles = data.objects.filter((obj: any) => obj.type === 'vehicle');
        
        runInAction(() => {
          this.vehicles = vehicles;
          this.lastUpdateTime = data.timestamp;
        });
        
        console.log(`🚗 Found ${vehicles.length} vehicles`);
        
      } else {
        console.warn('🚗 No valid objects in SDSM response');
        runInAction(() => {
          this.vehicles = [];
        });
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('🚗 SDSM API request timed out');
      } else {
        console.error('🚗 Error fetching vehicles:', error);
      }
      // Don't clear existing data on error
    }
  }
  
  /**
   * Convert API coordinates [lat, lng] to Mapbox format [lng, lat]
   */
  getMapboxCoordinates(vehicle: VehicleData): [number, number] {
    const [lat, lng] = vehicle.location.coordinates;
    return [lng, lat]; // Swap for Mapbox
  }
  
  get vehicleCount(): number {
    return this.vehicles.length;
  }
  
  cleanup = action("cleanup", (): void => {
    this.stop();
    runInAction(() => {
      this.vehicles = [];
    });
    console.log('🚗 TestingVehicleDisplayViewModel: Cleaned up');
  });
}