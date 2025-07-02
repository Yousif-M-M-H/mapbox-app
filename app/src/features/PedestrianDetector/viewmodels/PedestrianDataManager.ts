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
  private readonly API_URL = 'http://10.199.1.11:9095/latest/sdsm_events';
  private readonly REQUEST_TIMEOUT = 5000;
  
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
      const pedestrianData = this.extractPedestrianData(rawData);
      
      runInAction(() => {
        this.pedestrians = pedestrianData;
        this._lastUpdateTime = Date.now();
        this.loading = false;
      });
      
      console.log(`🚶 Found ${pedestrianData.length} pedestrians in SDSM data`);
      
    } catch (error) {
      const errorMessage = PedestrianErrorHandler.getErrorMessage(error);
      PedestrianErrorHandler.logError('fetchPedestrianData', error);
      
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
      });
      
      // Don't clear existing data on error, just log it
    }
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
      
      return await response.json();
      
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