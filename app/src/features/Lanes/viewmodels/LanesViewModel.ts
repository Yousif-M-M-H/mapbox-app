// app/src/features/Lanes/viewmodels/LanesViewModel.ts

import { makeAutoObservable } from 'mobx';
import { Lane, LegacyLane, LaneAdapter, LaneConfiguration, LaneStyle } from '../models/LaneTypes';
import { LaneRenderingService } from '../services/LaneRenderingService';
import { LANE_CONFIG, getLanesForIntersection, getLaneConfigForIntersection } from '../constants/LaneData';

export class LanesViewModel {
  // Observable state - use new Lane format internally
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
   * Get all visible lanes (converted to legacy format for rendering)
   */
  get visibleLanes(): LegacyLane[] {
    if (!this.visible) {
      return [];
    }
    const legacyLanes = LaneAdapter.toLegacyLanes(this.lanes);
    return LaneRenderingService.getVisibleLanes(legacyLanes);
  }

  /**
   * Get lane by ID (returns legacy format)
   */
  getLane(laneId: string): LegacyLane | undefined {
    const legacyLanes = LaneAdapter.toLegacyLanes(this.lanes);
    return LaneRenderingService.getLaneById(legacyLanes, laneId);
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
    // For now, this is not implemented as LegacyLane visibility is always true
    // In a full implementation, you'd need to track visibility separately
    // or extend the Lane interface to include visibility
    console.warn('Lane visibility toggle not implemented for new Lane format');
  }

  /**
   * Set visibility of a specific lane
   */
  setLaneVisibility(laneId: string, visible: boolean): void {
    // For now, this is not implemented as LegacyLane visibility is always true
    // In a full implementation, you'd need to track visibility separately
    console.warn('Lane visibility setting not implemented for new Lane format');
  }

  /**
   * Update lane style
   */
  updateLaneStyle(laneId: string, styleUpdate: Partial<LaneStyle>): void {
    // Style updates are handled at the rendering level, not in the lane data
    console.warn('Lane style updates not implemented for new Lane format');
  }

  /**
   * Add a new lane
   */
  addLane(lane: Lane): void {
    // Validate coordinates before adding
    if (!LaneRenderingService.validateLaneCoordinates(lane.geometry.coordinates)) {
      this.error = `Invalid coordinates for lane ${lane.laneID}`;
      return;
    }

    // Check if lane ID already exists
    if (this.lanes.find(l => l.laneID === lane.laneID)) {
      this.error = `Lane with ID ${lane.laneID} already exists`;
      return;
    }

    this.lanes.push(lane);
    this.error = null;
  }

  /**
   * Remove a lane
   */
  removeLane(laneId: string): void {
    // Convert laneId string to number for comparison
    const numericLaneId = parseInt(laneId.replace('lane-', ''));
    this.lanes = this.lanes.filter(lane => lane.laneID !== numericLaneId);
  }

  /**
   * Update lane coordinates
   */
  updateLaneCoordinates(laneId: string, coordinates: [number, number][]): void {
    if (!LaneRenderingService.validateLaneCoordinates(coordinates)) {
      this.error = `Invalid coordinates for lane ${laneId}`;
      return;
    }

    const numericLaneId = parseInt(laneId.replace('lane-', ''));
    this.lanes = this.lanes.map(lane =>
      lane.laneID === numericLaneId
        ? { ...lane, geometry: { ...lane.geometry, coordinates } }
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

  /**
   * Get lanes for a specific intersection
   */
  getLanesForIntersection(intersection: 'georgia' | 'houston' | 'all'): Lane[] {
    const intersectionLanes = getLanesForIntersection(intersection);
    return intersectionLanes.filter(lane =>
      this.lanes.some(myLane => myLane.laneID === lane.laneID)
    );
  }

  /**
   * Get visible lanes for a specific intersection
   */
  getVisibleLanesForIntersection(intersection: 'georgia' | 'houston' | 'all'): LegacyLane[] {
    if (!this.visible) {
      return [];
    }
    const intersectionLanes = this.getLanesForIntersection(intersection);
    const legacyLanes = LaneAdapter.toLegacyLanes(intersectionLanes);
    return LaneRenderingService.getVisibleLanes(legacyLanes);
  }

  /**
   * Load lanes for a specific intersection
   */
  loadIntersectionLanes(intersection: 'georgia' | 'houston' | 'all'): void {
    const config = getLaneConfigForIntersection(intersection);
    this.lanes = [...config.lanes];
    this.visible = config.visible;
    this.error = null;
  }

  /**
   * Add lanes from a specific intersection to current lanes
   */
  addIntersectionLanes(intersection: 'georgia' | 'houston'): void {
    const intersectionLanes = getLanesForIntersection(intersection);

    for (const lane of intersectionLanes) {
      // Check if lane ID already exists
      if (!this.lanes.find(l => l.laneID === lane.laneID)) {
        this.lanes.push(lane);
      }
    }
    this.error = null;
  }
}