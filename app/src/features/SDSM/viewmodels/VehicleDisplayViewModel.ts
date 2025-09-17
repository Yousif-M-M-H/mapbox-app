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
  
  // Statistics
  totalMessages: number = 0;
  newMessages: number = 0;
  duplicateMessages: number = 0;
  
  // Configuration
  private readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events';
  private readonly POLL_DELAY_MS = 100; // 100ms = 10Hz to match RSU
  private readonly FETCH_TIMEOUT_MS = 80; // Timeout before next cycle
  
  // State tracking
  private lastMessageHash: string | null = null;
  private isPolling: boolean = false;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Start the polling loop
   */
  start(): void {
    if (this.isActive) {
      console.log('✅ SDSM already running');
      return;
    }
    
    console.log('🚀 Starting SDSM polling at 10Hz');
    
    runInAction(() => {
      this.isActive = true;
      this.error = null;
      this.vehicles = [];
      this.lastMessageHash = null;
      this.totalMessages = 0;
      this.newMessages = 0;
      this.duplicateMessages = 0;
    });
    
    // Start the continuous polling loop
    this.runPollingLoop();
  }
  
  /**
   * Main polling loop - runs continuously with 100ms delay
   */
  private async runPollingLoop(): Promise<void> {
    this.isPolling = true;
    
    while (this.isActive && this.isPolling) {
      try {
        // Fetch current RSU state
        const data = await this.fetchFromRSU();
        
        if (data) {
          this.totalMessages++;
          
          // Create hash to check if message is new
          const messageHash = this.createHash(data);
          
          // Check if this is a new message
          if (messageHash !== this.lastMessageHash) {
            // NEW MESSAGE - Clear old and display new
            this.replaceAllVehicles(data);
            this.lastMessageHash = messageHash;
            this.newMessages++;
            
            // Log updates periodically
            if (this.newMessages % 10 === 0) {
              const efficiency = ((this.duplicateMessages / this.totalMessages) * 100).toFixed(1);
              console.log(`📊 SDSM: ${this.newMessages} updates | ${this.vehicles.length} vehicles | ${efficiency}% duplicates filtered`);
            }
          } else {
            // DUPLICATE - Skip to prevent flicker
            this.duplicateMessages++;
          }
        }
        
      } catch (error) {
        // Handle errors but keep loop running
        if (error instanceof Error) {
          console.error('❌ SDSM Error:', error.message);
          runInAction(() => {
            this.error = error.message;
          });
        }
      }
      
      // Wait 100ms before next check (maintains 10Hz)
      await this.sleep(this.POLL_DELAY_MS);
    }
    
    this.isPolling = false;
    console.log('🛑 SDSM polling stopped');
  }
  
  /**
   * Fetch data from RSU API
   */
  private async fetchFromRSU(): Promise<any> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.FETCH_TIMEOUT_MS);
    
    try {
      const response = await fetch(this.API_URL, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Timeout is expected occasionally - don't throw
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }
      
      throw error;
    }
  }
  
  /**
   * Create hash of message to detect changes
   */
  private createHash(data: any): string {
    if (!data?.objects) return 'empty';
    
    // Extract and sort vehicles for consistent hashing
    const vehicles = data.objects
      .filter((obj: any) => obj.type === 'vehicle')
      .sort((a: any, b: any) => a.objectID - b.objectID);
    
    // Hash: timestamp + count + vehicle IDs and positions
    return `${data.timestamp}|${vehicles.length}|${
      vehicles.map((v: any) => 
        `${v.objectID}@${v.location?.coordinates?.join(',')}`
      ).join('|')
    }`;
  }
  
  /**
   * Replace all vehicles (clear old, display new)
   */
  private replaceAllVehicles(data: any): void {
    // Parse vehicles from RSU data
    const newVehicles = this.parseVehicles(data);
    
    runInAction(() => {
      // COMPLETE REPLACEMENT - Clear old, show new
      this.vehicles = newVehicles;
      this.lastUpdateTime = Date.now();
      this.updateCount++;
      this.error = null;
    });
  }
  
  /**
   * Parse vehicle data from RSU message
   */
  private parseVehicles(data: any): VehicleInfo[] {
    if (!data?.objects || !Array.isArray(data.objects)) {
      return [];
    }
    
    return data.objects
      .filter((obj: any) => obj.type === 'vehicle')
      .map((obj: any) => ({
        id: obj.objectID,
        coordinates: obj.location?.coordinates || [0, 0], // [lat, lng]
        timestamp: obj.timestamp || data.timestamp,
        heading: obj.heading === 8191 ? undefined : obj.heading,
        speed: obj.speed === 8191 ? undefined : obj.speed,
        size: obj.size
      }))
      .filter((vehicle: VehicleInfo) => 
        vehicle.coordinates[0] !== 0 && vehicle.coordinates[1] !== 0
      );
  }
  
  /**
   * Stop polling
   */
  stop(): void {
    console.log('⏹️ Stopping SDSM...');
    
    this.isPolling = false;
    
    runInAction(() => {
      this.isActive = false;
      this.vehicles = [];
      this.lastMessageHash = null;
      this.error = null;
    });
    
    // Log final statistics
    if (this.totalMessages > 0) {
      const efficiency = ((this.duplicateMessages / this.totalMessages) * 100).toFixed(1);
      console.log(`📈 Final Stats: ${this.newMessages} updates from ${this.totalMessages} messages (${efficiency}% duplicates filtered)`);
    }
  }
  
  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Convert coordinates for Mapbox ([lat, lng] → [lng, lat])
   */
  getMapboxCoordinates(vehicle: VehicleInfo): [number, number] {
    const [lat, lng] = vehicle.coordinates;
    return [lng, lat];
  }
  
  /**
   * Get current vehicle count
   */
  get vehicleCount(): number {
    return this.vehicles.length;
  }
  
  /**
   * Get current statistics
   */
  get statistics() {
    const efficiency = this.totalMessages > 0 
      ? ((this.duplicateMessages / this.totalMessages) * 100).toFixed(1)
      : '0';
    
    return {
      vehicleCount: this.vehicleCount,
      totalMessages: this.totalMessages,
      newMessages: this.newMessages,
      duplicateMessages: this.duplicateMessages,
      efficiency: `${efficiency}%`,
      isActive: this.isActive,
      hasError: this.error !== null
    };
  }
  
  /**
   * Cleanup
   */
  cleanup(): void {
    this.stop();
  }
}