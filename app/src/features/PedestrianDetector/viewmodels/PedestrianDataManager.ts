// app/src/features/PedestrianDetector/viewModels/PedestrianDataManager.ts
// Handles SDSM API data fetching and pedestrian data management

import { makeAutoObservable, runInAction } from 'mobx';
import { PedestrianErrorHandler } from '../errorHandling/PedestrianErrorHandler';

export interface PedestrianData {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
  timestamp: string;
  heading?: number;
  speed?: number;
}

interface SDSMApiResponse {
  intersectionID: string;
  intersection: string;
  timestamp: string;
  objects: Array<{
    objectID: number;
    type: 'vehicle' | 'vru';
    timestamp: string;
    location: {
      type: string;
      coordinates: [number, number];
    };
    heading?: number;
    speed?: number;
    size?: {
      width: number | null;
      length: number | null;
    };
  }>;
}

export class PedestrianDataManager {
  // State
  pedestrians: PedestrianData[] = [];
  loading: boolean = false;
  error: string | null = null;
  private _lastUpdateTime: number = 0;
  
  // Configuration
  private readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events';
  private readonly REQUEST_TIMEOUT = 5000;
  
  // State preservation
  private lastMessageTimestamp: string | null = null;
  private pedestrianMap: Map<number, PedestrianData> = new Map();
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Fetch current pedestrian data from SDSM API
   */
  async fetchPedestrianData(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });
      
      const rawData = await this.performApiRequest();
      
      // Only update if we have a new message
      if (rawData.timestamp && rawData.timestamp !== this.lastMessageTimestamp) {
        this.lastMessageTimestamp = rawData.timestamp;
        this.updatePedestrianState(rawData);
      }
      // If timestamp is same, preserve current state
      
      runInAction(() => {
        this.loading = false;
      });
      
    } catch (error) {
      const errorMessage = PedestrianErrorHandler.getErrorMessage(error);
      PedestrianErrorHandler.logError('fetchPedestrianData', error);
      
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
      });
    }
  }
  
  /**
   * Update pedestrian state with new SDSM data
   */
  private updatePedestrianState(rawData: SDSMApiResponse): void {
    const pedestrianData = this.extractPedestrianData(rawData);
    
    // Update pedestrian map with new positions
    pedestrianData.forEach(pedestrian => {
      this.pedestrianMap.set(pedestrian.id, pedestrian);
    });
    
    // Remove pedestrians that are no longer in the data
    const currentPedestrianIds = new Set(pedestrianData.map(p => p.id));
    const keysToDelete: number[] = [];
    this.pedestrianMap.forEach((_, id) => {
      if (!currentPedestrianIds.has(id)) {
        keysToDelete.push(id);
      }
    });
    keysToDelete.forEach(id => this.pedestrianMap.delete(id));
    
    // Update observable array
    runInAction(() => {
      this.pedestrians = Array.from(this.pedestrianMap.values());
      this._lastUpdateTime = Date.now();
    });
  }
  
  /**
   * Get pedestrians count
   */
  get pedestrianCount(): number {
    return this.pedestrians.length;
  }
  
  /**
   * Check if data is fresh
   */
  isDataFresh(): boolean {
    const dataAge = Date.now() - this._lastUpdateTime;
    const maxAge = 10000; // 10 seconds
    return dataAge <= maxAge;
  }
  
  /**
   * Get data age in milliseconds
   */
  getDataAge(): number {
    return this._lastUpdateTime > 0 ? Date.now() - this._lastUpdateTime : -1;
  }
  
  /**
   * Clear pedestrian data
   */
  clearData(): void {
    runInAction(() => {
      this.pedestrians = [];
      this.pedestrianMap.clear();
      this.lastMessageTimestamp = null;
      this.error = null;
      this._lastUpdateTime = 0;
    });
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Perform the actual API request
   */
  private async performApiRequest(): Promise<SDSMApiResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
    
    try {
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
        throw new Error(`SDSM API error: ${response.status}`);
      }
      
      const rawData = await response.json();
      
      return rawData;
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw PedestrianErrorHandler.handleApiError(error);
    }
  }
  
  /**
   * Extract pedestrian data from API response
   */
  private extractPedestrianData(rawData: SDSMApiResponse): PedestrianData[] {
    if (!rawData?.objects || !Array.isArray(rawData.objects)) {
      PedestrianErrorHandler.logWarning('extractPedestrianData', 'No valid objects array in SDSM data');
      return [];
    }
    
    // Filter for VRU (pedestrian) objects only
    const pedestrianObjects = rawData.objects.filter(obj => obj.type === 'vru');
    
    // Convert to our pedestrian data format
    return pedestrianObjects.map(obj => ({
      id: obj.objectID,
      coordinates: obj.location.coordinates, // [lat, lon]
      timestamp: obj.timestamp,
      heading: obj.heading,
      speed: obj.speed
    }));
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.clearData();
    runInAction(() => {
      this.loading = false;
    });
  }
}