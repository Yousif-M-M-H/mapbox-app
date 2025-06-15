// app/src/testingFeatures/laneShiftTest/models/LaneModels.ts

/**
 * Simplified models for lane shift testing
 */

export interface ParsedLane {
  laneID: number;
  approach?: number;
  type: 'ingress' | 'egress';
  coordinates: [number, number][]; // [longitude, latitude] pairs
  rawData?: any; // Keep original data for reference
}

export interface TestLaneData {
  selectedLane: ParsedLane | null;
  intersectionId: number;
  refPoint: [number, number]; // [longitude, latitude]
  testStatus: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
}

/**
 * Sample MAP data structure (simplified)
 */
export interface MAPLaneNode {
  delta: [string, { lon: number; lat: number }];
  attributes?: any;
}

export interface MAPLane {
  laneID: number;
  ingressApproach?: number;
  egressApproach?: number;
  laneAttributes: any;
  nodeList: [string, MAPLaneNode[]];
  connectsTo?: any[];
}

export interface MAPIntersection {
  id: { id: number };
  refPoint: { lat: number; long: number; elevation?: number };
  laneSet: MAPLane[];
}