// app/src/features/Lanes/viewmodels/LanesViewModel.ts

import { makeAutoObservable } from 'mobx';
import { Lane, LaneConfiguration, LaneStyle } from '../models/LaneTypes';
import { LaneRenderingService } from '../services/LaneRenderingService';
import { LANE_CONFIG } from '../constants/LaneData';

export class LanesViewModel {
  // Observable state
  lanes: Lane[] = [];
  visible: boolean = true;
  error: string | null = null;

  constructor(initialConfig?: LaneConfiguration) {
    // Initialize with provided config or default config
    const config = initialConfig || LANE_CONFIG;
    this.lanes = [...config.lanes];
    this.visible = config.visible;

    makeAutoObservable(this);
  }

  /**
   * Get all visible lanes
   */
  get visibleLanes(): Lane[] {
    if (!this.visible) {
      return [];
    }
    return LaneRenderingService.getVisibleLanes(this.lanes);
  }

  /**
   * Get lane by ID
   */
  getLane(laneId: string): Lane | undefined {
    return LaneRenderingService.getLaneById(this.lanes, laneId);
  }

  /**
   * Toggle visibility of all lanes
   */
  toggleGlobalVisibility(): void {
    this.visible = !this.visible;
  }

  /**
   * Set global visibility
   */
  setGlobalVisibility(visible: boolean): void {
    this.visible = visible;
  }

  /**
   * Toggle visibility of a specific lane
   */
  toggleLaneVisibility(laneId: string): void {
    this.lanes = LaneRenderingService.toggleLaneVisibility(this.lanes, laneId);
  }

  /**
   * Set visibility of a specific lane
   */
  setLaneVisibility(laneId: string, visible: boolean): void {
    this.lanes = this.lanes.map(lane =>
      lane.id === laneId
        ? { ...lane, visible }
        : lane
    );
  }

  /**
   * Update lane style
   */
  updateLaneStyle(laneId: string, styleUpdate: Partial<LaneStyle>): void {
    this.lanes = LaneRenderingService.updateLaneStyle(this.lanes, laneId, styleUpdate);
  }

  /**
   * Add a new lane
   */
  addLane(lane: Lane): void {
    // Validate coordinates before adding
    if (!LaneRenderingService.validateLaneCoordinates(lane.coordinates)) {
      this.error = `Invalid coordinates for lane ${lane.id}`;
      return;
    }

    // Check if lane ID already exists
    if (this.getLane(lane.id)) {
      this.error = `Lane with ID ${lane.id} already exists`;
      return;
    }

    this.lanes.push(lane);
    this.error = null;
  }

  /**
   * Remove a lane
   */
  removeLane(laneId: string): void {
    this.lanes = this.lanes.filter(lane => lane.id !== laneId);
  }

  /**
   * Update lane coordinates
   */
  updateLaneCoordinates(laneId: string, coordinates: [number, number][]): void {
    if (!LaneRenderingService.validateLaneCoordinates(coordinates)) {
      this.error = `Invalid coordinates for lane ${laneId}`;
      return;
    }

    this.lanes = this.lanes.map(lane =>
      lane.id === laneId
        ? { ...lane, coordinates }
        : lane
    );
    this.error = null;
  }

  /**
   * Reset to default configuration
   */
  resetToDefault(): void {
    this.lanes = [...LANE_CONFIG.lanes];
    this.visible = LANE_CONFIG.visible;
    this.error = null;
  }

  /**
   * Get current configuration
   */
  getCurrentConfiguration(): LaneConfiguration {
    return {
      lanes: [...this.lanes],
      defaultStyle: LANE_CONFIG.defaultStyle,
      visible: this.visible
    };
  }

  /**
   * Clear any errors
   */
  clearError(): void {
    this.error = null;
  }

  /**
   * Get lanes count
   */
  get lanesCount(): number {
    return this.lanes.length;
  }

  /**
   * Get visible lanes count
   */
  get visibleLanesCount(): number {
    return this.visibleLanes.length;
  }

  /**
   * Check if any lanes are visible
   */
  get hasVisibleLanes(): boolean {
    return this.visible && this.visibleLanes.length > 0;
  }
}