// app/src/features/DirectionGuide/viewModels/SpatStateManager.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SpatIntegrationService } from '../services/SpatIntegrationService';
import { SignalState } from '../../SpatService/models/SpatModels';

/**
 * Manages SPaT state and monitoring
 * Single responsibility: Handle SPaT integration and state
 */
export class SpatStateManager {
  // State
  signalState: SignalState = SignalState.UNKNOWN;
  signalGroups: number[] = [];
  lastUpdate: number = 0;
  updateError: string | null = null;
  
  // Dependencies
  private spatService: SpatIntegrationService;
  private stateUpdateInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    makeAutoObservable(this);
    this.spatService = new SpatIntegrationService();
  }
  
  // ========================================
  // Public Methods
  // ========================================
  
  /**
   * Start SPaT monitoring for signal groups
   */
  async startMonitoring(signalGroups: number[]): Promise<void> {
    if (signalGroups.length === 0) {
      this.stopMonitoring();
      return;
    }
    
    try {
      // Stop any existing monitoring
      this.stopMonitoring();
      
      // Start service monitoring
      await this.spatService.startMonitoring(signalGroups);
      
      // Update local state
      runInAction(() => {
        this.signalGroups = signalGroups;
        this.updateError = null;
      });
      
      // Start state monitoring loop
      this.startStateMonitoring(signalGroups);
      
      console.log('🚦 SPaT monitoring started for signal groups:', signalGroups);
      
    } catch (error) {
      console.error(' SPaT ERROR:', error);
      runInAction(() => {
        this.updateError = error instanceof Error ? error.message : 'SPaT error';
        this.signalState = SignalState.UNKNOWN;
      });
    }
  }
  
  /**
   * Stop SPaT monitoring
   */
  stopMonitoring(): void {
    // Stop service monitoring
    this.spatService.stopMonitoring();
    
    // Stop state updates
    if (this.stateUpdateInterval) {
      clearTimeout(this.stateUpdateInterval);
      this.stateUpdateInterval = null;
    }
    
    // Clear state
    runInAction(() => {
      this.signalState = SignalState.UNKNOWN;
      this.signalGroups = [];
      this.updateError = null;
    });
    
    console.log('🛑 SPaT monitoring stopped');
  }
  
  /**
   * Force update SPaT state
   */
  async updateState(): Promise<void> {
    if (this.signalGroups.length === 0) {
      return;
    }
    
    try {
      const signalState = this.spatService.getCurrentSignalState(this.signalGroups);
      const dataAge = this.spatService.getSpatDataAge();
      
      runInAction(() => {
        this.signalState = signalState;
        this.lastUpdate = Date.now() - dataAge;
        this.updateError = null;
      });
      
    } catch (error) {
      console.error('SPaT state update failed:', error);
      runInAction(() => {
        this.updateError = error instanceof Error ? error.message : 'SPaT update failed';
      });
    }
  }
  
  // ========================================
  // Public Getters
  // ========================================
  
  /**
   * Check if we have valid SPaT data
   */
  get hasSpatData(): boolean {
    return this.signalGroups.length > 0 && this.signalState !== SignalState.UNKNOWN;
  }
  
  /**
   * Get SPaT status object
   */
  get spatStatus(): { state: SignalState; signalGroups: number[] } {
    return {
      state: this.signalState,
      signalGroups: this.signalGroups
    };
  }
  
  /**
   * Get age of SPaT data
   */
  get dataAge(): number {
    return this.lastUpdate > 0 ? Date.now() - this.lastUpdate : -1;
  }
  
  /**
   * Check if SPaT data is stale
   */
  get isDataStale(): boolean {
    const age = this.dataAge;
    return age > 3000; // Consider stale if older than 3 seconds
  }
  
  /**
   * Check if monitoring is active
   */
  get isMonitoring(): boolean {
    return this.spatService.isMonitoring();
  }
  
  /**
   * Check if SPaT data is valid and fresh
   */
  get isDataValid(): boolean {
    return this.spatService.isSpatDataValid();
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Start the state monitoring loop
   */
  private startStateMonitoring(signalGroups: number[]): void {
    const updateState = async () => {
      if (!this.spatService.isMonitoring()) {
        return; // Stop if monitoring was stopped
      }
      
      try {
        await this.updateState();
        
        // Schedule next update if still monitoring
        if (this.spatService.isMonitoring()) {
          this.stateUpdateInterval = setTimeout(updateState, 500);
        }
      } catch (error) {
        console.error('SPaT state monitoring error:', error);
        runInAction(() => {
          this.updateError = error instanceof Error ? error.message : 'Monitoring error';
        });
        
        // Try again after a delay
        if (this.spatService.isMonitoring()) {
          this.stateUpdateInterval = setTimeout(updateState, 1000);
        }
      }
    };
    
    // Start the monitoring loop
    updateState();
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.spatService.cleanup();
  }
}