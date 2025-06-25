import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MLK_INTERSECTION_ID, MLK_INTERSECTION_NAME } from '../constants/TestConstants';

export class MapDataService {
  
  // Dynamic lane width threshold (meters converted to coordinate units)
  private static readonly LANE_WIDTH_METERS = 3.5; // Standard lane width
  private static readonly METERS_TO_COORD_RATIO = 0.000009; // Approximate conversion
  private static readonly LANE_WIDTH_THRESHOLD = MapDataService.LANE_WIDTH_METERS * MapDataService.METERS_TO_COORD_RATIO;

  // Define lane groups (lanes that belong to the same road/approach)
  // This is scalable - can be configured per intersection or derived from API data
  private static readonly LANE_GROUPS = [
    {
      groupId: 'road_7_9',
      lanes: [7, 9], // Lanes 7 & 9 are on the same road
      description: 'MLK Jr Blvd approach'
    }
    // Future: more lane groups can be added here
    // { groupId: 'road_10_11', lanes: [10, 11], description: 'E Main St approach' }
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
        console.log(`🎯 Car detected in Lane ${lane.laneId}`);
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
        console.log(`🛣️ Car on ${group.description} → showing turns for all lanes: ${group.lanes.join(' & ')}`);
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
    // t = 0 means closest point is at lineStart
    // t = 1 means closest point is at lineEnd
    // 0 < t < 1 means closest point is between start and end
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
   * Get hardcoded lanes data (simulating API response with start/end coordinates only)
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
          // API will provide only start and end coordinates
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
        connectsTo: [],
        timestamp: new Date().toISOString(),
        location: {
          type: "LineString",
          // API will provide only start and end coordinates
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
   * If car is detected in any lane of a group, return ALL lanes in that group
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
   * Process car position - works dynamically for any intersection
   * Shows combined turns for the entire road/lane group when car is detected in any lane
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
    
    // Only log when car is detected and turns are available
    if (lanesForTurnCalculation.length > 0) {
      const allowedTurnTypes = allAllowedTurns.filter(t => t.allowed).map(t => t.type);
      const laneNumbers = lanesForTurnCalculation.map(l => l.laneId).join(' & ');
      console.log(`🚗 Showing combined turns for Lanes ${laneNumbers}: ${allowedTurnTypes.join(', ')}`);
    }
    
    return result;
  }

  /**
   * Calculate allowed turns from detected lanes
   * NOTE: When car is in multiple lanes, we combine turns using bitwise OR
   * This gives the driver all possible turn options from their current position
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
    // Example: If car is in both Lane 8 (bitmask 12) and Lane 9 (bitmask 12)
    // Result: 12 | 12 = 12 → shows combined turn options
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

  /**
   * Adjust lane width threshold dynamically based on intersection type or API data
   */
  public static setLaneWidthThreshold(widthInMeters: number): void {
    // This could be called when API provides intersection-specific lane width
    // For now, keeping it simple with a reasonable default
  }

  /**
   * Set lane groups for intersection (for future API integration)
   * This method allows dynamic configuration of lane groups per intersection
   */
  public static setLaneGroups(laneGroups: Array<{groupId: string, lanes: number[], description: string}>): void {
    // In future, this could be called when API provides intersection-specific lane grouping
    // For now, we use the static LANE_GROUPS, but this makes it extensible
    console.log(`🔧 Lane groups configured:`, laneGroups);
  }

  /**
   * Debug method to test lane detection for any intersection
   */
  public static debugLaneDetection(
    carPosition: [number, number], 
    intersectionData: MultiLaneMapData
  ): void {
    console.log(`🐛 Testing lane detection for intersection: ${intersectionData.intersectionName}`);
    console.log(`🐛 Car position: [${carPosition[0].toFixed(6)}, ${carPosition[1].toFixed(6)}]`);
    console.log(`🐛 Available lanes: ${intersectionData.lanes.map(l => l.laneId).join(', ')}`);
    
    // Test basic detection
    const detectedLanes = this.detectCarInLanes(carPosition, intersectionData);
    console.log(`🐛 Directly detected in lanes: ${detectedLanes.length > 0 ? detectedLanes.join(', ') : 'NONE'}`);
    
    // Test lane group expansion
    const laneGroup = this.getLaneGroupForDetectedLanes(detectedLanes);
    console.log(`🐛 Lane group for turn calculation: ${laneGroup.length > 0 ? laneGroup.join(', ') : 'NONE'}`);
    
    // Show distance to each lane for debugging
    intersectionData.lanes.forEach(lane => {
      const coordinates = lane.location.coordinates;
      if (coordinates.length >= 2) {
        const startPoint: [number, number] = [coordinates[0][1], coordinates[0][0]];
        const endPoint: [number, number] = [coordinates[coordinates.length - 1][1], coordinates[coordinates.length - 1][0]];
        const distance = this.distanceToLineSegment(carPosition, startPoint, endPoint);
        const isWithinThreshold = distance <= this.LANE_WIDTH_THRESHOLD;
        console.log(`🐛 Lane ${lane.laneId}: distance=${distance.toFixed(6)}, within_threshold=${isWithinThreshold}`);
      }
    });
  }

  // Legacy compatibility  
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