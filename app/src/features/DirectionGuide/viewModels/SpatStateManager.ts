// app/src/features/DirectionGuide/viewModels/SpatStateManager.ts
// Enhanced with reliable countdown timer

import { makeAutoObservable, runInAction } from 'mobx';
import { SpatIntegrationService } from '../services/SpatIntegrationService';
import { SignalState } from '../../SpatService/models/SpatModels';
import { CountdownTimerManager } from '../../SpatService/services/CountdownTimerManager';
import { CountdownResult } from '../../SpatService/services/ReliableCountdownService';
import { SpatIntegration } from '../../SpatService/SpatIntegration';

export class SpatStateManager {
  signalState: SignalState = SignalState.UNKNOWN;
  signalGroups: number[] = [];
  lastUpdate: number = 0;
  updateError: string | null = null;
  
  private spatService: SpatIntegrationService;
  private stateUpdateInterval: NodeJS.Timeout | null = null;
  private countdownManager: CountdownTimerManager;
  
  constructor() {
    makeAutoObservable(this);
    this.spatService = new SpatIntegrationService();
    this.countdownManager = new CountdownTimerManager();
  }
  
  /**
   * Get reliable countdown with 1-second updates
   */
  get countdown(): CountdownResult {
    return this.countdownManager.getCountdown();
  }
  
  // Existing methods with countdown integration
  async startMonitoring(signalGroups: number[]): Promise<void> {
    if (signalGroups.length === 0) {
      this.stopMonitoring();
      return;
    }
    
    try {
      this.stopMonitoring();
      await this.spatService.startMonitoring(signalGroups);
      
      runInAction(() => {
        this.signalGroups = signalGroups;
        this.updateError = null;
      });
      
      this.startStateMonitoring(signalGroups);
      
    } catch (error) {
      runInAction(() => {
        this.updateError = error instanceof Error ? error.message : 'SPaT error';
        this.signalState = SignalState.UNKNOWN;
      });
    }
  }
  
  stopMonitoring(): void {
    this.spatService.stopMonitoring();
    this.countdownManager.cleanup(); // Stop countdown timer
    
    if (this.stateUpdateInterval) {
      clearTimeout(this.stateUpdateInterval);
      this.stateUpdateInterval = null;
    }
    
    runInAction(() => {
      this.signalState = SignalState.UNKNOWN;
      this.signalGroups = [];
      this.updateError = null;
    });
    
  }
  
  async updateState(): Promise<void> {
    if (this.signalGroups.length === 0) return;
    
    try {
      const signalState = this.spatService.getCurrentSignalState(this.signalGroups);
      const dataAge = this.spatService.getSpatDataAge();
      
      runInAction(() => {
        this.signalState = signalState;
        this.lastUpdate = Date.now() - dataAge;
        this.updateError = null;
      });
      
      // Update countdown with fresh SPaT data
      this.updateCountdownWithFreshData();
      
    } catch (error) {
      runInAction(() => {
        this.updateError = error instanceof Error ? error.message : 'SPaT update failed';
      });
    }
  }
  
  /**
   * Update countdown with fresh SPaT data
   */
  private updateCountdownWithFreshData(): void {
    try {
      const spatViewModel = SpatIntegration.getSpatViewModel();
      const spatData = spatViewModel.currentSpatData;
      
      if (spatData && this.signalGroups.length > 0) {
        // Update countdown manager with fresh data
        this.countdownManager.updateWithSpatData(
          this.signalGroups,
          this.signalState,
          spatData
        );
      }
    } catch (error) {
    }
  }
  
  // Existing getters remain the same
  get hasSpatData(): boolean {
    return this.signalGroups.length > 0 && this.signalState !== SignalState.UNKNOWN;
  }
  
  get spatStatus(): { state: SignalState; signalGroups: number[] } {
    return {
      state: this.signalState,
      signalGroups: this.signalGroups
    };
  }
  
  get dataAge(): number {
    return this.lastUpdate > 0 ? Date.now() - this.lastUpdate : -1;
  }
  
  get isDataStale(): boolean {
    const age = this.dataAge;
    return age > 3000;
  }
  
  get isMonitoring(): boolean {
    return this.spatService.isMonitoring();
  }
  
  get isDataValid(): boolean {
    return this.spatService.isSpatDataValid();
  }
  
  private startStateMonitoring(signalGroups: number[]): void {
    const updateState = async () => {
      if (!this.spatService.isMonitoring()) return;
      
      try {
        await this.updateState();
        
        if (this.spatService.isMonitoring()) {
          this.stateUpdateInterval = setTimeout(updateState, 3000); // Every 3 seconds for fresh SPaT data
        }
      } catch (error) {
        runInAction(() => {
          this.updateError = error instanceof Error ? error.message : 'Monitoring error';
        });
        
        if (this.spatService.isMonitoring()) {
          this.stateUpdateInterval = setTimeout(updateState, 1000);
        }
      }
    };
    
    updateState();
  }
  
  cleanup(): void {
    this.stopMonitoring();
    this.countdownManager.cleanup();
    this.spatService.cleanup();
  }
}