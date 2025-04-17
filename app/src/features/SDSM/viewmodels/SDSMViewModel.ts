// app/src/features/SDSM/viewmodels/SDSMViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { SDSMVehicle, SDSMResponse } from '../models/SDSMData';
import { SDSMService } from '../services/SDSMService';

export class SDSMViewModel {
  vehicles: SDSMVehicle[] = [];
  loading: boolean = false;
  error: string | null = null;
  lastUpdated: Date | null = null;
  
  // Update interval in milliseconds (e.g., 5000ms = 5 seconds)
  updateInterval: number = 5000;
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
    
    console.log(`Auto-refresh started with interval: ${this.updateInterval}ms`);
  }
  
  /**
   * Stop auto-refreshing SDSM data
   */
  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Auto-refresh stopped');
    }
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
          this.vehicles = response.data;
          this.lastUpdated = new Date();
        } else {
          this.error = 'Failed to fetch SDSM data';
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        this.loading = false;
      });
    }
  }
  
  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    this.stopAutoRefresh();
  }
}