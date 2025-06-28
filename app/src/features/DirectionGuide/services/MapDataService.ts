// app/src/features/DirectionGuide/services/MapDataService.ts
import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MLK_INTERSECTION_ID, MLK_INTERSECTION_NAME } from '../constants/TestConstants';

export class MapDataService {
  
  // Dynamic lane width threshold (meters converted to coordinate units)
  private static readonly LANE_WIDTH_METERS = 3.5; // Standard lane width
  private static readonly METERS_TO_COORD_RATIO = 0.000009; // Approximate conversion
  private static readonly LANE_WIDTH_THRESHOLD = MapDataService.LANE_WIDTH_METERS * MapDataService.METERS_TO_COORD_RATIO;

  // Define lane groups (lanes that belong to the same road/approach)
  private static readonly LANE_GROUPS = [
    {
      groupId: 'road_7_9',
      lanes: [7, 9], // Lanes 7 & 9 are on the same road
      description: 'MLK Jr Blvd approach'
    }
  ];

  /**
   * Dynamic detection: check if car is on any lane using only start/end coordinates
   */
  public static detectCarInLanes(
    carPosition: [number, number], 
    allLanesData: MultiLaneMapData
  ): number[] {
    const [carLat, carLng] = carPosition;
    const detectedLanes: number[] = [];
    
    // Check each lane dynamically
    for (const lane of allLanesData.lanes) {
      if (this.isCarOnLane(carPosition, lane)) {
        detectedLanes.push(lane.laneId);
      }
    }
    
    return detectedLanes;
  }

  /**
   * Get lane group for detected lanes - if car is in any lane of a group, 
   * return ALL lanes in that group to show combined turns for the entire road
   */
  private static getLaneGroupForDetectedLanes(detectedLanes: number[]): number[] {
    if (detectedLanes.length === 0) return [];
    
    // Find which lane group contains any of the detected lanes
    for (const group of this.LANE_GROUPS) {
      // If any detected lane belongs to this group, return ALL lanes in the group
      if (detectedLanes.some(laneId => group.lanes.includes(laneId))) {
        return group.lanes;
      }
    }
    
    // If no group found, just return the detected lanes
    return detectedLanes;
  }

  /**
   * Check if car is on a specific lane using only start/end coordinates
   */
  private static isCarOnLane(carPosition: [number, number], lane: MapEventData): boolean {
    const coordinates = lane.location.coordinates;
    
    // Ensure we have at least start and end coordinates
    if (coordinates.length < 2) {
      return false;
    }
    
    // Get start and end points (convert from [lng, lat] to [lat, lng])
    const startPoint: [number, number] = [coordinates[0][1], coordinates[0][0]];
    const endPoint: [number, number] = [coordinates[coordinates.length - 1][1], coordinates[coordinates.length - 1][0]];
    
    // Calculate distance from car to lane line segment
    const distanceToLane = this.distanceToLineSegment(carPosition, startPoint, endPoint);
    
    // Check if car is within lane width
    return distanceToLane <= this.LANE_WIDTH_THRESHOLD;
  }

  /**
   * Calculate distance from point to line segment (dynamic for any 2 points)
   */
  private static distanceToLineSegment(
    point: [number, number],
    lineStart: [number, number], 
    lineEnd: [number, number]
  ): number {
    const [px, py] = point;
    const [x1, y1] = lineStart;
    const [x2, y2] = lineEnd;
    
    // Calculate line segment length squared
    const lineLength2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    
    if (lineLength2 === 0) {
      // Line segment is a point, return distance to that point
      return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    }
    
    // Calculate parameter t (projection of point onto line)
    const t = Math.max(0, Math.min(1, 
      ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLength2
    ));
    
    // Calculate closest point on line segment
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);
    
    // Return distance from point to closest point on segment
    return Math.sqrt((px - closestX) * (px - closestX) + (py - closestY) * (py - closestY));
  }

  /**
   * Get hardcoded lanes data with signal groups included
   */
  public static async fetchAllLanesData(): Promise<MultiLaneMapData> {
    const lanes: MapEventData[] = [
      {
        intersectionId: MLK_INTERSECTION_ID,
        intersectionName: MLK_INTERSECTION_NAME,
        laneId: 7,
        laneAttributes: {
          directionalUse: [0],
          sharedWith: [],
          laneType: ["vehicle", []]
        },
        maneuvers: [2560, 12],
        connectsTo: [],
        timestamp: new Date().toISOString(),
        location: {
          type: "LineString",
          coordinates: [
            [-85.2922136, 35.039848],   // Start
            [-85.2922941, 35.0398777]   // End
          ]
        }
      },
      {
        intersectionId: MLK_INTERSECTION_ID,
        intersectionName: MLK_INTERSECTION_NAME,
        laneId: 9,
        laneAttributes: {
          directionalUse: [0],
          sharedWith: [],
          laneType: ["vehicle", []]
        },
        maneuvers: [0, 12],
        // Add signal group 2 for lane 9
        connectsTo: [
          {
            signalGroup: 2,
            connectingLane: {
              lane: 9,
              maneuver: ['straight']
            }
          }
        ],
        timestamp: new Date().toISOString(),
        location: {
          type: "LineString",
          coordinates: [
            [-85.2922264, 35.0397893],   // Start
            [-85.2941284, 35.0404962]    // End
          ]
        }
      }
    ];

    return {
      intersectionId: MLK_INTERSECTION_ID,
      intersectionName: MLK_INTERSECTION_NAME,
      timestamp: new Date().toISOString(),
      lanes: lanes
    };
  }

  /**
   * Get lanes that should be used for turn calculation
   */
  public static getLanesForCarPosition(
    allLanesData: MultiLaneMapData, 
    carPosition: [number, number]
  ): MapEventData[] {
    // First, detect which specific lanes the car is actually in
    const detectedLanes = this.detectCarInLanes(carPosition, allLanesData);
    
    // Then, get the full lane group for turn calculation
    const laneGroupIds = this.getLaneGroupForDetectedLanes(detectedLanes);
    
    // Return lane data for the entire group
    return allLanesData.lanes.filter(lane => laneGroupIds.includes(lane.laneId));
  }

  /**
   * Get signal groups for detected lanes
   */
  public static getSignalGroupsForDetectedLanes(
    allLanesData: MultiLaneMapData,
    carPosition: [number, number]
  ): number[] {
    const detectedLanes = this.detectCarInLanes(carPosition, allLanesData);
    const signalGroups: number[] = [];
    
    // Get signal groups for each detected lane
    for (const laneId of detectedLanes) {
      const lane = allLanesData.lanes.find(l => l.laneId === laneId);
      if (lane && lane.connectsTo) {
        for (const connection of lane.connectsTo) {
          if (connection.signalGroup && typeof connection.signalGroup === 'number') {
            signalGroups.push(connection.signalGroup);
          }
        }
      }
    }
    
    return [...new Set(signalGroups)]; // Remove duplicates
  }

  /**
   * Process car position - works dynamically for any intersection
   */
  public static processCarPositionData(
    allLanesData: MultiLaneMapData,
    carPosition: [number, number]
  ): ProcessedIntersectionData {
    const lanesForTurnCalculation = this.getLanesForCarPosition(allLanesData, carPosition);
    const allAllowedTurns = this.calculateAllowedTurns(lanesForTurnCalculation);
    
    const result: ProcessedIntersectionData = {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN,
      allAllowedTurns,
      totalLanes: lanesForTurnCalculation.length,
      coordinates: [],
      timestamp: allLanesData.timestamp,
    };
    
    return result;
  }

  /**
   * Calculate allowed turns from detected lanes
   */
  private static calculateAllowedTurns(lanes: MapEventData[]): AllowedTurn[] {
    if (lanes.length === 0) {
      return [
        { type: TurnType.LEFT, allowed: false },
        { type: TurnType.STRAIGHT, allowed: false },
        { type: TurnType.RIGHT, allowed: false },
        { type: TurnType.U_TURN, allowed: false },
      ];
    }

    // Combine maneuvers from all detected lanes using bitwise OR
    let combinedBitmask = 0;
    lanes.forEach(lane => {
      if (lane.maneuvers && lane.maneuvers.length >= 2) {
        combinedBitmask |= lane.maneuvers[1];
      }
    });

    return [
      { type: TurnType.U_TURN, allowed: (combinedBitmask & 1) === 1 },
      { type: TurnType.RIGHT, allowed: (combinedBitmask & 2) === 2 },
      { type: TurnType.LEFT, allowed: (combinedBitmask & 4) === 4 },
      { type: TurnType.STRAIGHT, allowed: (combinedBitmask & 8) === 8 },
    ];
  }

  // Legacy compatibility methods
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }

  public static processApproachData(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection,
    carPosition: [number, number] = [35.039848, -85.2922136]
  ): ProcessedIntersectionData {
    return this.processCarPositionData(allLanesData, carPosition);
  }
}