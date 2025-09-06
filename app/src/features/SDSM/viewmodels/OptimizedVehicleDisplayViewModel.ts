// app/src/features/SDSM/viewmodels/OptimizedVehicleDisplayViewModel.ts
import { makeAutoObservable, runInAction, observable, computed, action } from 'mobx';
import { VehicleInfo } from '../models/SDSMData';

export class OptimizedVehicleDisplayViewModel {
  // Observable state with more granular observability
  @observable.shallow vehicles: VehicleInfo[] = [];
  @observable isActive: boolean = false;
  @observable lastUpdateTime: number = 0;
  @observable updateCount: number = 0;
  @observable error: string | null = null;
  
  // Private properties
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events';
  private readonly POLL_FREQUENCY = 50; // Increased to 50ms for better real-time performance
  private readonly REQUEST_TIMEOUT = 1500; // Reduced timeout for faster error handling
  private lastMessageTimestamp: string | null = null;
  private vehicleMap: Map<number, VehicleInfo> = new Map();
  
  // Performance optimization: batch updates
  private pendingUpdates: Set<number> = new Set();
  private batchUpdateTimeout: NodeJS.Timeout | null = null;
  
  // Connection management
  private abortController: AbortController | null = null;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  @computed get vehicleCount(): number {
    return this.vehicles.length;
  }
  
  @computed get isConnected(): boolean {
    return this.isActive && this.error === null;
  }
  
  @action
  start(): void {
    if (this.isActive) return;
    
    this.isActive = true;
    this.error = null;
    this.updateCount = 0;
    this.vehicleMap.clear();
    this.pendingUpdates.clear();
    
    // Start polling with immediate first fetch
    this.startPolling();
    this.fetchVehicles(); // Immediate first fetch
  }
  
  @action
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.batchUpdateTimeout) {
      clearTimeout(this.batchUpdateTimeout);
      this.batchUpdateTimeout = null;
    }
    
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    
    this.isActive = false;
    this.vehicles = [];
    this.vehicleMap.clear();
    this.pendingUpdates.clear();
    this.lastMessageTimestamp = null;
  }
  
  private startPolling(): void {
    this.updateInterval = setInterval(() => {
      this.fetchVehicles();
    }, this.POLL_FREQUENCY);
  }
  
  private async fetchVehicles(): Promise<void> {
    if (!this.isActive) return;
    
    try {
      // Cancel previous request if still pending
      if (this.abortController) {
        this.abortController.abort();
      }
      
      this.abortController = new AbortController();
      const timeoutId = setTimeout(() => this.abortController?.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: this.abortController.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      const rawData = await response.json();
      
      // Only process if this is genuinely new data
      if (rawData.timestamp && rawData.timestamp !== this.lastMessageTimestamp) {
        this.lastMessageTimestamp = rawData.timestamp;
        this.updateVehicleState(rawData);
      }
      
      // Clear error state on successful fetch
      if (this.error) {
        runInAction(() => {
          this.error = null;
        });
      }
      
    } catch (error) {
      // Only set error state for non-abort errors
      if (error instanceof Error && error.name !== 'AbortError') {
        runInAction(() => {
          this.error = error.message;
        });
      }
    } finally {
      this.abortController = null;
    }
  }
  
  @action
  private updateVehicleState(data: any): void {
    const newVehicles = this.extractVehicles(data);
    let hasChanges = false;
    
    // Process new/updated vehicles
    newVehicles.forEach(vehicle => {
      const existing = this.vehicleMap.get(vehicle.id);
      
      if (!existing) {
        // New vehicle
        this.vehicleMap.set(vehicle.id, vehicle);
        this.pendingUpdates.add(vehicle.id);
        hasChanges = true;
      } else {
        // Check if vehicle actually changed (avoid unnecessary updates)
        if (this.hasVehicleChanged(existing, vehicle)) {
          this.vehicleMap.set(vehicle.id, vehicle);
          this.pendingUpdates.add(vehicle.id);
          hasChanges = true;
        }
      }
    });
    
    // Remove vehicles no longer present
    const currentVehicleIds = new Set(newVehicles.map(v => v.id));
    const vehiclesToRemove: number[] = [];
    
    this.vehicleMap.forEach((_, id) => {
      if (!currentVehicleIds.has(id)) {
        vehiclesToRemove.push(id);
        hasChanges = true;
      }
    });
    
    vehiclesToRemove.forEach(id => {
      this.vehicleMap.delete(id);
      this.pendingUpdates.delete(id);
    });
    
    // Batch UI updates for better performance
    if (hasChanges) {
      this.scheduleBatchUpdate();
    }
  }
  
  private hasVehicleChanged(existing: VehicleInfo, updated: VehicleInfo): boolean {
    return (
      existing.coordinates[0] !== updated.coordinates[0] ||
      existing.coordinates[1] !== updated.coordinates[1] ||
      existing.heading !== updated.heading ||
      existing.speed !== updated.speed
    );
  }
  
  private scheduleBatchUpdate(): void {
    if (this.batchUpdateTimeout) return; // Already scheduled
    
    // Use requestAnimationFrame equivalent for smooth updates
    this.batchUpdateTimeout = setTimeout(() => {
      this.performBatchUpdate();
      this.batchUpdateTimeout = null;
    }, 16); // ~60fps update rate
  }
  
  @action
  private performBatchUpdate(): void {
    this.vehicles = Array.from(this.vehicleMap.values());
    this.lastUpdateTime = performance.now();
    this.updateCount++;
    this.pendingUpdates.clear();
  }
  
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
  
  getMapboxCoordinates(vehicle: VehicleInfo): [number, number] {
    const [lat, lng] = vehicle.coordinates;
    return [lng, lat]; // Mapbox expects [longitude, latitude]
  }
  
  // Performance monitoring
  @computed get performanceMetrics() {
    return {
      updateFrequency: this.POLL_FREQUENCY,
      lastUpdateTime: this.lastUpdateTime,
      updateCount: this.updateCount,
      vehicleCount: this.vehicleCount,
      isConnected: this.isConnected,
      error: this.error
    };
  }
  
  cleanup(): void {
    this.stop();
  }
}