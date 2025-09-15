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
  
  // NEW: Traffic monitoring
  currentTrafficLevel: 'low' | 'medium' | 'high' = 'low';
  
  // Private properties
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events';
  
  // ADAPTIVE PARAMETERS - Change based on traffic
  private adaptiveConfig = {
    low: {
      pollFrequency: 150,        // 150ms (6.7Hz) - Less aggressive than original 50ms
      maxConcurrentRequests: 1,  // Single request stream instead of 2
      staleThreshold: 5000,      // 5 seconds instead of 2 seconds
      requestTimeout: 300        // 300ms timeout
    },
    medium: {
      pollFrequency: 250,        // 250ms (4Hz) - More conservative
      maxConcurrentRequests: 1,  // Still single stream
      staleThreshold: 7000,      // 7 seconds - More patience
      requestTimeout: 500        // 500ms timeout
    },
    high: {
      pollFrequency: 500,        // 500ms (2Hz) - Much slower during heavy traffic
      maxConcurrentRequests: 1,  // Definitely single stream
      staleThreshold: 10000,     // 10 seconds - Very patient
      requestTimeout: 1000       // 1 second timeout
    }
  };
  
  // Get current configuration based on traffic level
  private get currentConfig() {
    return this.adaptiveConfig[this.currentTrafficLevel];
  }
  
  // Track message sequence
  private lastProcessedSequence: number = -1;
  private lastProcessedTimestamp: string | null = null;
  
  // Async request management
  private activeRequests: Set<AbortController> = new Set();
  private responseQueue: QueuedResponse[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  
  // Track vehicles with lastSeen for stale removal (now adaptive)
  private vehicleMap: Map<number, { vehicle: VehicleInfo, lastSeen: number }> = new Map();
  
  // Performance tracking
  private requestCounter: number = 0;
  private successfulRequests: number = 0;
  private failedRequests: number = 0;
  
  // NEW: Traffic monitoring variables
  private trafficHistory: number[] = [];
  private lastTrafficCheck: number = 0;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Start real-time vehicle tracking with adaptive management
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
      this.currentTrafficLevel = 'low'; // Start conservative
      this.trafficHistory = [];
      this.lastTrafficCheck = 0;
    });
    
    // Start the adaptive pipeline
    this.startAdaptivePipeline();
  }
  
  /**
   * Start adaptive pipeline that adjusts to traffic conditions
   */
  private startAdaptivePipeline(): void {
    // 1. Start fetching loop with adaptive frequency
    this.updateFetchingInterval();
    
    // 2. Start processing loop - Always fast for smooth updates
    this.processingInterval = setInterval(() => {
      this.processResponseQueue();
      this.updateTrafficLevel(); // Monitor traffic every processing cycle
    }, 16); // Keep processing at 60fps for smooth updates
    
    // Fire initial request
    this.fireAsyncRequest();
  }
  
  /**
   * Update fetching interval based on current traffic level
   */
  private updateFetchingInterval(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    const config = this.currentConfig;
    
    this.updateInterval = setInterval(() => {
      if (this.activeRequests.size < config.maxConcurrentRequests) {
        this.fireAsyncRequest();
      }
    }, config.pollFrequency);
    
    console.log(`🚦 Traffic Level: ${this.currentTrafficLevel}, Poll Rate: ${config.pollFrequency}ms, Stale Threshold: ${config.staleThreshold}ms`);
  }
  
  /**
   * Monitor traffic levels and adapt accordingly
   */
  private updateTrafficLevel(): void {
    const now = Date.now();
    
    // Check traffic every 5 seconds
    if (now - this.lastTrafficCheck < 5000) return;
    this.lastTrafficCheck = now;
    
    const vehicleCount = this.vehicles.length;
    
    // Add to traffic history (keep last 6 measurements = 30 seconds)
    this.trafficHistory.push(vehicleCount);
    if (this.trafficHistory.length > 6) {
      this.trafficHistory.shift();
    }
    
    // Calculate average traffic over the period
    const avgTraffic = this.trafficHistory.reduce((a, b) => a + b, 0) / this.trafficHistory.length;
    
    // Determine traffic level with hysteresis to prevent oscillation
    let newTrafficLevel: 'low' | 'medium' | 'high';
    
    if (avgTraffic <= 3) {
      newTrafficLevel = 'low';
    } else if (avgTraffic <= 8) {
      newTrafficLevel = 'medium';
    } else {
      newTrafficLevel = 'high';
    }
    
    // Only change if it's different and update fetching rate
    if (newTrafficLevel !== this.currentTrafficLevel) {
      runInAction(() => {
        this.currentTrafficLevel = newTrafficLevel;
      });
      
      this.updateFetchingInterval(); // Adjust polling rate
      console.log(`🚦 Traffic adapted: ${avgTraffic.toFixed(1)} vehicles → ${newTrafficLevel} mode`);
    }
  }
  
  /**
   * Fire an async request with adaptive timeout
   */
  private fireAsyncRequest(): void {
    if (!this.isActive) return;
    
    const controller = new AbortController();
    this.activeRequests.add(controller);
    this.requestCounter++;
    
    const config = this.currentConfig;
    
    // Set adaptive timeout based on traffic level
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, config.requestTimeout);
    
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
      
      // Keep queue size reasonable (last 5 responses during heavy traffic)
      const maxQueueSize = this.currentTrafficLevel === 'high' ? 3 : 5;
      if (this.responseQueue.length > maxQueueSize) {
        this.responseQueue.shift();
      }
    })
    .catch(error => {
      // Silently ignore aborts and timeouts during high traffic
      if (error.name !== 'AbortError') {
        this.failedRequests++;
        
        // Only set error state if we're consistently failing
        const failureRate = this.failedRequests / (this.requestCounter || 1);
        if (failureRate > 0.7 && this.requestCounter > 10) {
          runInAction(() => {
            this.error = `High failure rate during ${this.currentTrafficLevel} traffic`;
          });
        }
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
    
    // Always clean up stale vehicles with adaptive threshold
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
   * Remove vehicles that haven't been seen recently (adaptive threshold)
   */
  private removeStaleVehicles(): void {
    const now = Date.now();
    const config = this.currentConfig;
    const vehiclesToRemove: number[] = [];
    
    this.vehicleMap.forEach((value, id) => {
      if (now - value.lastSeen > config.staleThreshold) {
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
      
      // Optional: Log vehicle removal (can be commented out in production)
      if (this.currentTrafficLevel === 'high' && vehiclesToRemove.length > 3) {
        console.log(`🗑️ Removed ${vehiclesToRemove.length} stale vehicles (${config.staleThreshold}ms threshold, ${this.currentTrafficLevel} traffic)`);
      }
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
   * Get performance metrics including traffic info
   */
  get performanceMetrics() {
    const config = this.currentConfig;
    return {
      trafficLevel: this.currentTrafficLevel,
      pollFrequency: config.pollFrequency,
      staleThreshold: config.staleThreshold,
      requestTimeout: config.requestTimeout,
      activeRequests: this.activeRequests.size,
      queuedResponses: this.responseQueue.length,
      totalRequests: this.requestCounter,
      successfulRequests: this.successfulRequests,
      failedRequests: this.failedRequests,
      successRate: this.requestCounter > 0 
        ? (this.successfulRequests / this.requestCounter * 100).toFixed(1) + '%'
        : '0%',
      avgTraffic: this.trafficHistory.length > 0
        ? (this.trafficHistory.reduce((a, b) => a + b, 0) / this.trafficHistory.length).toFixed(1)
        : '0'
    };
  }
  
  /**
   * Get current adaptive configuration (for debugging)
   */
  get currentAdaptiveConfig() {
    return {
      level: this.currentTrafficLevel,
      config: this.currentConfig,
      vehicleCount: this.vehicles.length,
      trafficHistory: this.trafficHistory
    };
  }
  
  /**
   * Manual traffic level override (for testing)
   */
  setTrafficLevel(level: 'low' | 'medium' | 'high'): void {
    if (level !== this.currentTrafficLevel) {
      runInAction(() => {
        this.currentTrafficLevel = level;
      });
      this.updateFetchingInterval();
      console.log(`🚦 Manual traffic override: ${level} mode`);
    }
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stop();
  }
}