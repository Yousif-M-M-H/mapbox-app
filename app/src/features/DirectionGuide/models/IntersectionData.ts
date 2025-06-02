// app/src/features/DirectionGuide/models/IntersectionData.ts
import { AllowedTurn, ApproachDirection } from './DirectionTypes';

/**
 * Interface representing raw map data from the API for a single lane
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
 * Interface representing multiple lanes data from the API
 */
export interface MultiLaneMapData {
  intersectionId: number;
  intersectionName: string;
  timestamp: string;
  lanes: MapEventData[];
}

/**
 * Interface representing processed intersection data for the view model
 */
export interface ProcessedIntersectionData {
  intersectionId: number;
  intersectionName: string;
  approachDirection: ApproachDirection;
  allAllowedTurns: AllowedTurn[]; // Combined from all lanes
  totalLanes: number;
  coordinates: [number, number][];
  timestamp: string;
}

//i also wanna add folder called testingFeature
//inside it should have folder testingPedstrianDetectorFeatureTest

//in this i should have the same logic for detecting pedestrain within the crosswalk (and display the message when vehcile is 30 meters away)
//im doing this so i dont always change the main folder for pedestrianDetector Feature
//SO I ONLY CALL the test folder instead of the feature folder you get it?