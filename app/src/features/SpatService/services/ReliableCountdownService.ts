// app/src/features/SpatService/services/ReliableCountdownService.ts
// Clean, reliable countdown using consistent API field

import { SpatData, SignalState } from '../models/SpatModels';

export interface CountdownResult {
  remainingSeconds: number;
  hasCountdown: boolean;
  formattedTime: string;
}

export class ReliableCountdownService {
  
  /**
   * Get reliable countdown using spatVehMaxTimeToChange (most accurate field)
   * This field represents the maximum time until the signal changes
   */
  static getCountdown(
    signalGroups: number[],
    currentState: SignalState,
    spatData: SpatData
  ): CountdownResult {
    
    if (signalGroups.length === 0 || currentState === SignalState.UNKNOWN) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    // Find the active signal group for current state
    const activeSignalGroup = this.findActiveSignalGroup(signalGroups, currentState, spatData);
    
    if (!activeSignalGroup) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    // Get the MaxTimeToChange for this phase (most reliable field)
    const remainingSeconds = this.getMaxTimeToChange(activeSignalGroup, spatData);
    
    if (remainingSeconds <= 0) {
      return { remainingSeconds: 0, hasCountdown: false, formattedTime: '' };
    }

    return {
      remainingSeconds,
      hasCountdown: true,
      formattedTime: this.formatTime(remainingSeconds)
    };
  }

  /**
   * Find which signal group is currently active for the given state
   */
  private static findActiveSignalGroup(
    signalGroups: number[],
    currentState: SignalState,
    spatData: SpatData
  ): number | null {
    
    for (const signalGroup of signalGroups) {
      const isActive = this.isSignalGroupActive(signalGroup, currentState, spatData);
      if (isActive) {
        return signalGroup;
      }
    }
    
    return null;
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
   * Get MaxTimeToChange for specific phase - CONSISTENT SOURCE OF TRUTH
   */
  private static getMaxTimeToChange(phaseId: number, spatData: SpatData): number {
    // Use spatVehMaxTimeToChange{N} as the consistent source of truth
    const fieldName = `spatVehMaxTimeToChange${phaseId}` as keyof SpatData;
    const timeValue = spatData[fieldName] as number;
    
    // Log for debugging
    console.log(`🕐 Phase ${phaseId}: MaxTimeToChange = ${timeValue}s`);
    
    return Math.max(0, timeValue || 0);
  }

  /**
   * Format time consistently
   */
  private static formatTime(seconds: number): string {
    if (seconds <= 0) return '';
    
    // For times under 2 minutes, show seconds
    if (seconds < 120) {
      return `${seconds}s`;
    }
    
    // For longer times, show minutes:seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Log debug info for troubleshooting
   */
  static debugSignalTiming(spatData: SpatData): void {
    console.log('🔍 SPAT TIMING DEBUG:');
    console.log('Greens:', spatData.phaseStatusGroupGreens);
    console.log('Reds:', spatData.phaseStatusGroupReds);
    console.log('Yellows:', spatData.phaseStatusGroupYellows);
    
    // Log timing for active phases
    const activePhases = [
      ...spatData.phaseStatusGroupGreens,
      ...spatData.phaseStatusGroupReds,
      ...spatData.phaseStatusGroupYellows
    ];
    
    activePhases.forEach(phase => {
      const maxTime = spatData[`spatVehMaxTimeToChange${phase}` as keyof SpatData] as number;
      const minTime = spatData[`spatVehMinTimeToChange${phase}` as keyof SpatData] as number;
      console.log(`Phase ${phase}: Min=${minTime}s, Max=${maxTime}s`);
    });
  }
}