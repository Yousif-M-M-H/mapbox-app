// app/src/features/SpatService/services/CountdownTimerManager.ts
// Manages 1-second countdown timer with proper synchronization

import { makeAutoObservable, runInAction } from 'mobx';
import { ReliableCountdownService, CountdownResult } from './ReliableCountdownService';
import { SpatData, SignalState } from '../models/SpatModels';

export class CountdownTimerManager {
  // Current countdown state
  currentCountdown: CountdownResult = { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
  
  // Timer management
  private countdownTimer: NodeJS.Timeout | null = null;
  private lastSpatUpdate: number = 0;
  private baseRemainingTime: number = 0;
  private countdownStartTime: number = 0;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Update with fresh SPaT data and restart countdown
   */
  updateWithSpatData(
    signalGroups: number[],
    currentState: SignalState,
    spatData: SpatData
  ): void {
    
    // Get fresh countdown from SPaT data
    const freshCountdown = ReliableCountdownService.getCountdown(signalGroups, currentState, spatData);
    
    // Reset timer with new data
    this.resetCountdownTimer(freshCountdown);
    
    // Log for debugging
    if (freshCountdown.hasCountdown) {
      console.log(`🕐 New countdown: ${freshCountdown.remainingSeconds}s for phases [${signalGroups.join(',')}]`);
    }
  }
  
  /**
   * Reset countdown timer with fresh data
   */
  private resetCountdownTimer(freshCountdown: CountdownResult): void {
    // Stop existing timer
    this.stopCountdownTimer();
    
    if (!freshCountdown.hasCountdown || freshCountdown.remainingSeconds <= 0) {
      runInAction(() => {
        this.currentCountdown = { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
      });
      return;
    }
    
    // Set new baseline
    this.baseRemainingTime = freshCountdown.remainingSeconds;
    this.countdownStartTime = Date.now();
    this.lastSpatUpdate = Date.now();
    
    // Update immediately
    runInAction(() => {
      this.currentCountdown = freshCountdown;
    });
    
    // Start 1-second countdown timer
    this.startCountdownTimer();
  }
  
  /**
   * Start 1-second countdown timer
   */
  private startCountdownTimer(): void {
    this.countdownTimer = setInterval(() => {
      this.updateCountdownDisplay();
    }, 1000); // Update every 1 second
  }
  
  /**
   * Update countdown display based on elapsed time
   */
  private updateCountdownDisplay(): void {
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - this.countdownStartTime) / 1000);
    const calculatedRemaining = Math.max(0, this.baseRemainingTime - elapsedSeconds);
    
    // Check if countdown should stop
    if (calculatedRemaining <= 0) {
      this.stopCountdownTimer();
      runInAction(() => {
        this.currentCountdown = { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
      });
      return;
    }
    
    // Update display
    runInAction(() => {
      this.currentCountdown = {
        remainingSeconds: calculatedRemaining,
        hasCountdown: true,
        formattedTime: this.formatTime(calculatedRemaining)
      };
    });
    
    // Log every 5 seconds for debugging
    if (elapsedSeconds % 5 === 0) {
      console.log(`🕐 Countdown: ${calculatedRemaining}s (${this.formatTime(calculatedRemaining)})`);
    }
  }
  
  /**
   * Stop countdown timer
   */
  private stopCountdownTimer(): void {
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
  }
  
  /**
   * Format time consistently (matches ReliableCountdownService)
   */
  private formatTime(seconds: number): string {
    if (seconds <= 0) return '';
    
    if (seconds < 120) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  /**
   * Check if we need fresh SPaT data (called externally)
   */
  needsFreshData(): boolean {
    const age = Date.now() - this.lastSpatUpdate;
    return age > 10000; // Request fresh data every 10 seconds
  }
  
  /**
   * Get current countdown for display
   */
  getCountdown(): CountdownResult {
    return this.currentCountdown;
  }
  
  /**
   * Cleanup timer
   */
  cleanup(): void {
    this.stopCountdownTimer();
    runInAction(() => {
      this.currentCountdown = { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    });
  }
}