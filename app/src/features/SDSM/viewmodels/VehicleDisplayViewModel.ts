// app/src/features/SDSM/viewmodels/VehicleDisplayViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { VehicleInfo } from '../models/SDSMData';

interface QueuedResponse {
  timestamp: number;
  data: any;
  sequenceNumber?: number;
}

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
  private readonly POLL_FREQUENCY = 50; // 50ms (20Hz) to catch all 10Hz updates
  private readonly REQUEST_TIMEOUT = 200; // Very short timeout - we'll get fresh data soon anyway
  private readonly MAX_CONCURRENT_REQUESTS = 2; // Allow up to 2 parallel requests
  
  // Track message sequence
  private lastProcessedSequence: number = -1;
  private lastProcessedTimestamp: string | null = null;
  
  // Async request management
  private activeRequests: Set<AbortController> = new Set();
  private responseQueue: QueuedResponse[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  // Track vehicles with lastSeen for stale removal
  private vehicleMap: Map<number, { vehicle: VehicleInfo, lastSeen: number }> = new Map();
  private readonly VEHICLE_STALE_THRESHOLD = 2000; // Remove vehicles not seen for 2 seconds
  
  // Performance tracking
  private requestCounter: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  
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
      this.lastProcessedSequence = -1;
      this.lastProcessedTimestamp = null;
      this.responseQueue = [];
      this.activeRequests.clear();
      this.requestCounter = 0;
      this.successfulRequests = 0;
      this.failedRequests = 0;
    });
    
    // Start the async pipeline
    this.startAsyncPipeline();
  }
  
  /**
   * Start async pipeline with parallel fetching and sequential processing
   */
  private startAsyncPipeline(): void {
    // 1. Start fetching loop - fires requests without waiting
    this.updateInterval = setInterval(() => {
      if (this.activeRequests.size < this.MAX_CONCURRENT_REQUESTS) {
        this.fireAsyncRequest();
      }
    }, this.POLL_FREQUENCY);
    
    // 2. Start processing loop - processes responses in order
    this.processingInterval = setInterval(() => {
      this.processResponseQueue();
    }, 16); // Process at 60fps for smooth updates
    
    // Fire initial requests
    this.fireAsyncRequest();
  }
  
  /**
   * Fire an async request without blocking
   */
  private fireAsyncRequest(): void {
    if (!this.isActive) return;
    
    const controller = new AbortController();
    this.activeRequests.add(controller);
    this.requestCounter++;
    
    // Set a very short timeout - we don't want to wait long
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, this.REQUEST_TIMEOUT);
    
    // Fire the request without awaiting
    fetch(this.API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      signal: controller.signal,
    })
    .then(response => {
      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      // Add to queue for processing
      this.responseQueue.push({
        timestamp: Date.now(),
        data: data,
        sequenceNumber: data.spatMessageSeqCounter
      });
      this.successfulRequests++;
      
      // Keep queue size reasonable (last 10 responses)
      if (this.responseQueue.length > 10) {
        this.responseQueue.shift();
      }
    })
    .catch(error => {
      // Silently ignore aborts and timeouts - we'll get fresh data soon
      if (error.name !== 'AbortError') {
        this.failedRequests++;
        // Don't set error state for individual failures
      }
    })
    .finally(() => {
      clearTimeout(timeoutId);
      this.activeRequests.delete(controller);
    });
  }
  
  /**
   * Process queued responses in order
   */
  private processResponseQueue(): void {
    if (this.responseQueue.length === 0) return;
    
    // Sort by timestamp to ensure order
    this.responseQueue.sort((a, b) => a.timestamp - b.timestamp);
    
    // Process all queued responses
    while (this.responseQueue.length > 0) {
      const response = this.responseQueue.shift();
      if (response && this.shouldProcessResponse(response)) {
        this.updateVehicleState(response.data);
        
        // Update tracking
        if (response.data.timestamp) {
          this.lastProcessedTimestamp = response.data.timestamp;
        }
        if (response.sequenceNumber !== undefined) {
          this.lastProcessedSequence = response.sequenceNumber;
        }
      }
    }
    
    // Always clean up stale vehicles
    this.removeStaleVehicles();
  }
  
  /**
   * Determine if we should process this response
   */
  private shouldProcessResponse(response: QueuedResponse): boolean {
    // Always process if we have no previous data
    if (this.lastProcessedSequence === -1 && this.lastProcessedTimestamp === null) {
      return true;
    }
    
    // Check sequence number if available
    if (response.sequenceNumber !== undefined && 
        response.sequenceNumber !== this.lastProcessedSequence) {
      return true;
    }
    
    // Check timestamp
    if (response.data.timestamp && 
        response.data.timestamp !== this.lastProcessedTimestamp) {
      return true;
    }
    
    // Check for actual vehicle changes
    const newVehicles = this.extractVehicles(response.data);
    return this.hasVehicleDataChanged(newVehicles);
  }
  
  /**
   * Check if vehicle data has actually changed
   */
  private hasVehicleDataChanged(newVehicles: VehicleInfo[]): boolean {
    const currentIds = new Set(this.vehicleMap.keys());
    const newIds = new Set(newVehicles.map(v => v.id));
    
    // Different vehicle count
    if (currentIds.size !== newIds.size) {
      return true;
    }
    
    // Check for position changes
    for (const newVehicle of newVehicles) {
      const existing = this.vehicleMap.get(newVehicle.id);
      if (!existing || this.hasVehicleChanged(existing.vehicle, newVehicle)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Stop vehicle tracking
   */
  stop(): void {
    // Clear intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    // Abort all active requests
    this.activeRequests.forEach(controller => controller.abort());
    this.activeRequests.clear();
    
    runInAction(() => {
      this.isActive = false;
      this.vehicles = [];
      this.vehicleMap.clear();
      this.responseQueue = [];
      this.lastProcessedSequence = -1;
      this.lastProcessedTimestamp = null;
    });
  }
  
  /**
   * Update vehicle state with new SDSM data
   */
  private updateVehicleState(data: any): void {
    const newVehicles = this.extractVehicles(data);
    const now = Date.now();
    
    // Process new/updated vehicles with lastSeen tracking
    newVehicles.forEach(vehicle => {
      const existingEntry = this.vehicleMap.get(vehicle.id);
      
      if (!existingEntry) {
        // New vehicle
        this.vehicleMap.set(vehicle.id, { vehicle, lastSeen: now });
      } else {
        // Update existing vehicle
        if (this.hasVehicleChanged(existingEntry.vehicle, vehicle)) {
          this.vehicleMap.set(vehicle.id, { vehicle, lastSeen: now });
        } else {
          // Even if data hasn't changed, update lastSeen
          existingEntry.lastSeen = now;
        }
      }
    });
    
    // Update observable array
    runInAction(() => {
      this.vehicles = Array.from(this.vehicleMap.values()).map(v => v.vehicle);
      this.lastUpdateTime = Date.now();
      this.updateCount++;
      
      // Clear error if we're getting data successfully
      if (this.error && this.successfulRequests > this.failedRequests) {
        this.error = null;
      }
    });
  }
  
  /**
   * Remove vehicles that haven't been seen recently
   */
  private removeStaleVehicles(): void {
    const now = Date.now();
    const vehiclesToRemove: number[] = [];
    
    this.vehicleMap.forEach((value, id) => {
      if (now - value.lastSeen > this.VEHICLE_STALE_THRESHOLD) {
        vehiclesToRemove.push(id);
      }
    });
    
    if (vehiclesToRemove.length > 0) {
      vehiclesToRemove.forEach(id => {
        this.vehicleMap.delete(id);
      });
      
      // Update observable array if vehicles were removed
      runInAction(() => {
        this.vehicles = Array.from(this.vehicleMap.values()).map(v => v.vehicle);
      });
    }
  }
  
  /**
   * Check if vehicle data has changed
   */
  private hasVehicleChanged(existing: VehicleInfo, updated: VehicleInfo): boolean {
    // Check position changes (most important for smooth updates)
    if (existing.coordinates[0] !== updated.coordinates[0] ||
        existing.coordinates[1] !== updated.coordinates[1]) {
      return true;
    }
    
    // Check other important attributes
    if (existing.heading !== updated.heading ||
        existing.speed !== updated.speed) {
      return true;
    }
    
    return false;
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
        timestamp: obj.timestamp || data.timestamp,
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
   * Get performance metrics
   */
  get performanceMetrics() {
    return {
      activeRequests: this.activeRequests.size,
      queuedResponses: this.responseQueue.length,
      totalRequests: this.requestCounter,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.requestCounter > 0 
        ? (this.successfulRequests / this.requestCounter * 100).toFixed(1) + '%'
        : '0%'
    };
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
  }
}