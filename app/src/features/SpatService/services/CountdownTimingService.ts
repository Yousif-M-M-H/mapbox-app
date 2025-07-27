// app/src/features/SpatService/services/CountdownTimingService.ts
// Clean, simple service for countdown timing using existing API fields

import { SpatData, SignalState } from '../models/SpatModels';

export interface CountdownResult {
  remainingSeconds: number;
  hasCountdown: boolean;
  formattedTime: string;
}

export class CountdownTimingService {
  
  /**
   * Get countdown for signal groups - uses existing API timing fields
   */
  static getCountdownForSignalGroups(
    signalGroups: number[],
    currentState: SignalState,
    spatData: SpatData
  ): CountdownResult {
    
    if (signalGroups.length === 0 || currentState === SignalState.UNKNOWN) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    // Find the active timing for current signal state
    let remainingSeconds = 0;
    let hasValidTiming = false;

    for (const signalGroup of signalGroups) {
      // Check if this signal group is currently active
      const isActiveForCurrentState = this.isSignalGroupActive(signalGroup, currentState, spatData);
      
      if (isActiveForCurrentState) {
        // Get the timing field for this phase
        const timing = this.getTimingForPhase(signalGroup, spatData);
        if (timing > 0) {
          remainingSeconds = timing;
          hasValidTiming = true;
          break; // Use first valid timing found
        }
      }
    }

    if (!hasValidTiming) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    return {
      remainingSeconds,
      hasCountdown: true,
      formattedTime: this.formatCountdown(remainingSeconds)
    };
  }

  /**
   * Check if signal group is active for current state
   */
  private static isSignalGroupActive(
    signalGroup: number,
    currentState: SignalState,
    spatData: SpatData
  ): boolean {
    switch (currentState) {
      case SignalState.GREEN:
        return spatData.phaseStatusGroupGreens.includes(signalGroup);
      case SignalState.YELLOW:
        return spatData.phaseStatusGroupYellows.includes(signalGroup);
      case SignalState.RED:
        return spatData.phaseStatusGroupReds.includes(signalGroup);
      default:
        return false;
    }
  }

  /**
   * Get timing for specific phase using existing API fields
   */
  private static getTimingForPhase(phaseId: number, spatData: SpatData): number {
    // Use spatVehMaxTimeToChange{N} field for the phase
    const timingField = `spatVehMaxTimeToChange${phaseId}` as keyof SpatData;
    const timing = spatData[timingField] as number;
    return timing || 0;
  }

  /**
   * Format seconds into readable countdown
   */
  static formatCountdown(seconds: number): string {
    if (seconds <= 0) return '';
    
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${seconds}s`;
  }
}