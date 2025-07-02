// app/src/features/SpatService/viewModels/SpatDataManager.ts
// Handles data fetching and caching

import { makeAutoObservable, runInAction } from 'mobx';
import { SpatApiService } from '../services/SpatApiService';
import { DataMappingService } from '../services/DataMappingService';
import { SpatErrorHandler } from '../errorHandling/SpatErrorHandler';
import { SpatData } from '../models/SpatModels';

export class SpatDataManager {
  // State
  currentSpatData: SpatData | null = null;
  loading: boolean = false;
  error: string | null = null;
  private _lastUpdateTime: number = 0;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Fetch current SPaT data
   */
  async fetchCurrentData(): Promise<void> {
    try {
      runInAction(() => {
        this.loading = true;
        this.error = null;
      });
      
      const rawData = await SpatApiService.fetchSpatData();
      const spatData = DataMappingService.mapApiResponseToSpatData(rawData);
      
      runInAction(() => {
        this.currentSpatData = spatData;
        this._lastUpdateTime = Date.now();
        this.loading = false;
      });
      
    } catch (error) {
      const errorMessage = SpatErrorHandler.getErrorMessage(error);
      SpatErrorHandler.logError('fetchCurrentData', error);
      
      runInAction(() => {
        this.error = errorMessage;
        this.loading = false;
      });
      throw error;
    }
  }
  
  /**
   * Check if current data is valid and fresh
   */
  isDataValid(): boolean {
    if (!this.currentSpatData) return false;
    
    const dataAge = Date.now() - this._lastUpdateTime;
    const maxAge = 5000; // 5 seconds
    
    return dataAge <= maxAge;
  }
  
  /**
   * Get age of current data in milliseconds
   */
  getDataAge(): number {
    return this._lastUpdateTime > 0 ? Date.now() - this._lastUpdateTime : -1;
  }
  
  /**
   * Get last update timestamp
   */
  get lastUpdateTime(): number {
    return this._lastUpdateTime;
  }
  
  /**
   * Clear cached data
   */
  clearData(): void {
    runInAction(() => {
      this.currentSpatData = null;
      this.error = null;
      this._lastUpdateTime = 0;
    });
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