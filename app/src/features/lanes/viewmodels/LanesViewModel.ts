// app/src/features/lanes/viewmodels/LanesViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Lane, LanesResponse } from '../models/Lane';
import { LanesService } from '../services/LanesService';
import { LaneErrorHandler, LaneErrorType, LaneError } from '../utils/LaneErrorHandler';

export class LanesViewModel {
  lanes: Lane[] = [];
  loading: boolean = false;
  error: LaneError | null = null;
  lastUpdated: Date | null = null;
  
  // Add a property for the MLK Central intersection ID
  readonly MLK_CENTRAL_ID: number = 27481;
  
  // Auto-refresh settings
  autoRefreshEnabled: boolean = false;
  autoRefreshInterval: number = 30000; // 30 seconds default for lane data
  private intervalId: NodeJS.Timeout | null = null;
  
  // Retry settings
  maxRetries: number = 3;
  currentRetry: number = 0;
  baseRetryDelay: number = 1000; // 1 second base delay

  constructor() {
    makeAutoObservable(this);
  }

  /**
   * Fetch lane data from Redis
   * @param intersectionId Optional intersection ID to filter by (defaults to MLK Central)
   */
  async fetchLanesData(intersectionId: number = this.MLK_CENTRAL_ID) {
    this.loading = true;
    this.error = null;
    
    try {
      // Call our updated LanesService that now uses Redis
      const response = await LanesService.fetchLanesData(intersectionId);
      
      runInAction(() => {
        if (response.success) {
          this.lanes = response.data;
          this.lastUpdated = new Date();
          this.currentRetry = 0; // Reset retry counter on success
          
          if (this.lanes.length > 0) {
            // console.log(`Updated with ${this.lanes.length} lanes from intersection ID ${intersectionId}`);
          } else {
            // console.log(`No lanes found for intersection ID ${intersectionId}`);
          }
        } else {
          // Handle error from response
          if (response.error) {
            this.error = response.error;
            
            // Attempt retry if appropriate
            this.handleRetry(intersectionId);
          } else {
            // Create a generic error if no specific error was provided
            this.error = LaneErrorHandler.createError(
              new Error('Failed to fetch lane data'),
              LaneErrorType.FETCH_ERROR
            );
          }
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        // Create and store a structured error
        this.error = LaneErrorHandler.createError(error);
        LaneErrorHandler.logError(this.error);
        
        // Attempt retry if appropriate
        this.handleRetry(intersectionId);
        
        this.loading = false;
      });
    }
  }
  
  /**
   * Handle retry logic for failed requests
   * @param intersectionId The intersection ID to retry fetching for
   */
  private handleRetry(intersectionId: number) {
    if (this.error && LaneErrorHandler.shouldRetry(this.error) && this.currentRetry < this.maxRetries) {
      const retryDelay = LaneErrorHandler.getRetryDelay(this.currentRetry, this.baseRetryDelay);
      
      console.log(`Retrying lane data fetch in ${retryDelay}ms (attempt ${this.currentRetry + 1}/${this.maxRetries})`);
      
      setTimeout(() => {
        runInAction(() => {
          this.currentRetry += 1;
          this.fetchLanesData(intersectionId);
        });
      }, retryDelay);
    }
  }
  
  /**
   * Get user-friendly error message
   */
  get errorMessage(): string {
    return this.error ? LaneErrorHandler.getUserMessage(this.error) : '';
  }
  
  /**
   * Start auto-refreshing lane data
   * @param interval Optional refresh interval in milliseconds
   */
  startAutoRefresh(interval?: number) {
    // Clear any existing interval
    this.stopAutoRefresh();
    
    // Update interval if provided
    if (interval && interval > 0) {
      this.autoRefreshInterval = interval;
    }
    
    // Fetch immediately
    this.fetchLanesData(this.MLK_CENTRAL_ID);
    
    // Set up interval for future refreshes
    this.intervalId = setInterval(() => {
      console.log(`Auto-refreshing lane data (interval: ${this.autoRefreshInterval}ms)`);
      this.fetchLanesData(this.MLK_CENTRAL_ID);
    }, this.autoRefreshInterval);
    
    this.autoRefreshEnabled = true;
    console.log(`Lane data auto-refresh started (interval: ${this.autoRefreshInterval}ms)`);
  }
  
  /**
   * Stop auto-refreshing lane data
   */
  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.autoRefreshEnabled = false;
      console.log('Lane data auto-refresh stopped');
    }
  }
  
  /**
   * Set auto-refresh interval
   * @param interval Refresh interval in milliseconds
   */
  setAutoRefreshInterval(interval: number) {
    if (interval >= 5000) { // Minimum 5 seconds to avoid excessive API calls
      this.autoRefreshInterval = interval;
      
      // Restart auto-refresh if it's active
      if (this.autoRefreshEnabled) {
        this.stopAutoRefresh();
        this.startAutoRefresh();
      }
      
      console.log(`Lane data auto-refresh interval set to ${interval}ms`);
    }
  }

  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    this.stopAutoRefresh();
    console.log('Lanes view model cleaned up');
  }
}