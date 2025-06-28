// app/src/features/SpatService/SpatIntegration.ts

import { SpatViewModel } from './viewModels/SpatViewModel';
import { SignalState, LaneSignalStatus } from './models/SpatModels';

/**
 * Integration interface for other features to use SPaT service
 * This is the main entry point for DirectionGuide to interact with SPaT
 */
export class SpatIntegration {
  private static spatViewModel: SpatViewModel | null = null;
  
  /**
   * Get SPaT ViewModel instance (singleton)
   */
  public static getSpatViewModel(): SpatViewModel {
    if (!this.spatViewModel) {
      this.spatViewModel = new SpatViewModel();
    }
    return this.spatViewModel;
  }
  
  /**
   * Start monitoring signals for an approach
   */
  public static async startApproachMonitoring(
    approachId: string,
    approachName: string,
    laneIds: number[],
    lanesData: any[]
  ): Promise<void> {
    const viewModel = this.getSpatViewModel();
    await viewModel.startMonitoringApproach(approachId, approachName, laneIds, lanesData);
  }
  
  /**
   * Stop monitoring signals
   */
  public static stopMonitoring(): void {
    const viewModel = this.getSpatViewModel();
    viewModel.stopMonitoring();
  }
  
  /**
   * Get current signal state for approach
   */
  public static getCurrentSignalState(): SignalState {
    const viewModel = this.getSpatViewModel();
    return viewModel.approachSignalState;
  }
  
  /**
   * Check if SPaT data is available
   */
  public static hasSignalData(): boolean {
    const viewModel = this.getSpatViewModel();
    return viewModel.hasSignalData;
  }
  
  /**
   * Get signal status text for UI
   */
  public static getSignalStatusText(): string {
    const viewModel = this.getSpatViewModel();
    return viewModel.signalStatusText;
  }
  
  /**
   * Get signal color class for UI
   */
  public static getSignalColorClass(): string {
    const viewModel = this.getSpatViewModel();
    return viewModel.signalColorClass;
  }
  
  /**
   * Get lane signal statuses
   */
  public static getLaneSignalStatuses(): LaneSignalStatus[] {
    const viewModel = this.getSpatViewModel();
    return viewModel.laneSignalStatuses;
  }
  
  /**
   * Check if monitoring is active
   */
  public static isMonitoring(): boolean {
    const viewModel = this.getSpatViewModel();
    return viewModel.isMonitoring;
  }
  
  /**
   * One-time signal check for lanes (without monitoring)
   */
  public static async checkSignalForLanes(
    laneIds: number[],
    lanesData: any[]
  ): Promise<LaneSignalStatus[]> {
    const viewModel = this.getSpatViewModel();
    return viewModel.getSignalStatusForLanes(laneIds, lanesData);
  }
  
  /**
   * Cleanup resources
   */
  public static cleanup(): void {
    if (this.spatViewModel) {
      this.spatViewModel.cleanup();
      this.spatViewModel = null;
    }
  }
}

// Re-export types for convenience, but import them from models
export type { SignalState, LaneSignalStatus } from './models/SpatModels';