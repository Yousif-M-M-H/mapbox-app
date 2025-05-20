import { AllowedTurn, ApproachDirection } from './DirectionTypes';

/**
 * Interface representing raw map data from the API
 * Based on the sample data structure from http://10.199.1.11:9095/latest/map_events
 */
export interface MapEventData {
  intersectionId: number;
  intersectionName: string;
  laneId: number;
  laneAttributes: {
    directionalUse: number[];
    sharedWith: number[];
    laneType: [string, number[]];
  };
  maneuvers: number[];
  connectsTo: any[];
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number][];
  };
}

/**
 * Interface representing processed intersection data for the view model
 */
export interface ProcessedIntersectionData {
  intersectionId: number;
  intersectionName: string;
  approachDirection: ApproachDirection;
  allowedTurns: AllowedTurn[];
  coordinates: [number, number][];
  timestamp: string;
}