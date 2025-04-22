// app/src/features/SDSM/viewmodels/SDSMViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { SDSMVehicle, SDSMResponse } from '../models/SDSMData';
import { SDSMService } from '../services/SDSMService';

export class SDSMViewModel {
  vehicles: SDSMVehicle[] = [];
  loading: boolean = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Update interval in milliseconds
  updateInterval: number = 200; // 200ms (5Hz) for smooth updates
  private intervalId: NodeJS.Timeout | null = null;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Start auto-refreshing SDSM data at the specified interval
   */
  startAutoRefresh() {
    // Clear any existing interval
    this.stopAutoRefresh();
    
    // Fetch data immediately
    this.fetchSDSMData();
    
    // Set up interval for future updates
    this.intervalId = setInterval(() => {
      this.fetchSDSMData();
    }, this.updateInterval);
    
    console.log(`SDSM auto-refresh started with interval: ${this.updateInterval}ms`);
  }
  
  /**
   * Stop auto-refreshing SDSM data
   */
  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('SDSM auto-refresh stopped');
    }
  }
  
  /**
   * Process vehicle data to ensure coordinates and headings are valid
   */
  processVehicleData(vehicles: SDSMVehicle[]): SDSMVehicle[] {
    return vehicles.filter(vehicle => {
      if (!vehicle.location || !Array.isArray(vehicle.location.coordinates) || vehicle.location.coordinates.length !== 2) {
        console.warn(`Vehicle ${vehicle.objectID} has invalid location data`);
        return false;
      }
      
      const [longitude, latitude] = vehicle.location.coordinates;
      
      // Check if coordinates are numbers and within valid ranges
      if (isNaN(longitude) || isNaN(latitude) || 
          Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
        console.warn(`Vehicle ${vehicle.objectID} has invalid coordinates: [${longitude}, ${latitude}]`);
        return false;
      }
      
      return true;
    }).map(vehicle => {
      // Normalize heading to 0-360 range
      if (vehicle.heading !== undefined) {
        vehicle.heading = ((vehicle.heading % 360) + 360) % 360;
      }
      
      return vehicle;
    });
  }
  
  /**
   * Fetch SDSM data from the API
   */
  async fetchSDSMData() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await SDSMService.fetchSDSMData();
      
      runInAction(() => {
        if (response.success) {
          // Process the data to ensure coordinates are correct
          const processedVehicles = this.processVehicleData(response.data);
          this.vehicles = processedVehicles;
          this.lastUpdated = new Date();
          
          if (processedVehicles.length > 0) {
            console.log(`Updated with ${processedVehicles.length} vehicles`);
          }
        } else {
          this.error = 'Failed to fetch SDSM data';
          console.error('SDSM data fetch error:', this.error);
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('SDSM data fetch exception:', this.error);
        this.loading = false;
      });
    }
  }
  
  /**
   * Set the update interval and restart the auto-refresh if active
   * @param interval Interval in milliseconds
   */
  setUpdateInterval(interval: number) {
    if (interval >= 100) { // Minimum 100ms (10Hz) to match data frequency
      this.updateInterval = interval;
      
      // Restart auto-refresh if it's currently active
      if (this.intervalId) {
        this.stopAutoRefresh();
        this.startAutoRefresh();
      }
      
      console.log(`SDSM update interval changed to ${interval}ms`);
    }
  }
  
  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    this.stopAutoRefresh();
    console.log('SDSM view model cleaned up');
  }
}