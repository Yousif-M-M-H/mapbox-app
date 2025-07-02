// app/src/features/DirectionGuide/models/LaneDetectionModels.ts

/**
 * Lane detection specific models and types
 */

export interface DetectedLane {
  laneId: number;
  isActive: boolean;
  detectionTime: number;
}

export interface LaneDetectionState {
  detectedLaneIds: number[];
  currentApproachName: string;
  isInAnyLane: boolean;
  lastDetectionTime: number;
}

export interface LaneDetectionConfig {
  detectionThrottleMs: number;
  laneWidthThreshold: number;
  metersToCoordRatio: number;
}

export interface LaneGroup {
  groupId: string;
  lanes: number[];
  description: string;
}

export const DEFAULT_LANE_DETECTION_CONFIG: LaneDetectionConfig = {
  detectionThrottleMs: 500,
  laneWidthThreshold: 3.5 * 0.000009, // 3.5 meters converted to coordinate units
  metersToCoordRatio: 0.000009
};