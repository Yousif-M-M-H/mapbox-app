import { makeAutoObservable, runInAction } from 'mobx';
import { SDSMApiClient } from '../api/SDSMApiClient';
import { VehicleDataService } from '../services/VehicleDataService';
import { PollingService } from '../services/PollingService';
import { VehicleData } from '../models/SDSMTypes';

export class VehicleStore {
  vehicles: VehicleData[] = [];
  isActive = false;
  error: string | null = null;
  lastUpdate = 0;
  
  private pollingService = new PollingService();
  private lastTimestamp: string | null = null;
  private vehicleMap = new Map<number, VehicleData>();

  constructor() {
    makeAutoObservable(this);
  }

  start(): void {
    if (this.isActive) return;
    
    runInAction(() => {
      this.isActive = true;
      this.error = null;
      this.vehicleMap.clear();
    });
    
    this.pollingService.start(() => this.fetchVehicles(), 100);
  }

  stop(): void {
    this.pollingService.stop();
    
    runInAction(() => {
      this.isActive = false;
      this.vehicles = [];
      this.vehicleMap.clear();
      this.lastTimestamp = null;
    });
  }

  private async fetchVehicles(): Promise<void> {
    try {
      const response = await SDSMApiClient.fetchData();
      
      // Only update if new data
      if (response.timestamp !== this.lastTimestamp) {
        this.lastTimestamp = response.timestamp;
        this.updateVehicles(response);
      }
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Failed to fetch';
      });
    }
  }

  private updateVehicles(response: any): void {
    const newVehicles = VehicleDataService.extractVehicles(response);
    
    // Update map
    const currentIds = new Set(newVehicles.map(v => v.id));
    
    // Add/update vehicles
    newVehicles.forEach(vehicle => {
      this.vehicleMap.set(vehicle.id, vehicle);
    });
    
    // Remove old vehicles
    Array.from(this.vehicleMap.keys()).forEach(id => {
      if (!currentIds.has(id)) {
        this.vehicleMap.delete(id);
      }
    });
    
    runInAction(() => {
      this.vehicles = Array.from(this.vehicleMap.values());
      this.lastUpdate = Date.now();
      this.error = null;
    });
  }

  get vehicleCount(): number {
    return this.vehicles.length;
  }

  cleanup(): void {
    this.stop();
  }
}