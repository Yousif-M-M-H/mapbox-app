// app/src/features/DirectionGuide/services/MapDataService.ts
import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';

// Define the actual API response structure
interface ActualAPIResponse {
  intersection: string;
  intersectionId: number | null;
  timestamp: string;
  intersections: Array<{
    intersectionId: number;
    intersectionName: string;
    refPoint: { lat: number; lon: number; };
    lanes: Array<{
      laneId: number;
      laneAttributes: {
        directionalUse: number[];
        sharedWith: number[];
        laneType: [string, number[]];
      };
      maneuvers: number[];
      connectsTo: any[];
      location: { type: string; coordinates: [number, number][]; };
    }>;
  }>;
}

// --- FIX: allow indexing by any ApproachDirection, but guard undefined ---
const APPROACH_LANE_GROUPS: Partial<Record<ApproachDirection, number[]>> = {
  [ApproachDirection.NORTH]: [1, 2],    // Lanes 1 & 2 are northbound
  [ApproachDirection.SOUTH]: [12, 13],  // Lanes 12 & 13 are southbound  
  [ApproachDirection.EAST]:  [8, 9],    // Lanes 8 & 9 are eastbound
  [ApproachDirection.WEST]:  [5, 6],    // Lanes 5 & 6 are westbound
};

export class MapDataService {
  /**
   * Fetches ALL lanes data for MLK intersection
   */
  public static async fetchAllLanesData(): Promise<MultiLaneMapData> {
    try {
      const endpoint = `${MAP_DATA_API_URL}?intersectionId=${MLK_INTERSECTION_ID}`;
      console.log('Fetching lanes data from:', endpoint);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ActualAPIResponse = await response.json();
      
      if (!data.intersections || data.intersections.length === 0) {
        throw new Error('No intersections found in API response');
      }
      
      const intersection = data.intersections[0];
      
      if (!intersection.lanes || !Array.isArray(intersection.lanes)) {
        throw new Error('No lanes found in intersection data');
      }
      
      // Convert to our format
      const lanes: MapEventData[] = intersection.lanes.map(lane => ({
        intersectionId:   intersection.intersectionId,
        intersectionName: intersection.intersectionName,
        laneId:           lane.laneId,
        laneAttributes:   lane.laneAttributes,
        maneuvers:        lane.maneuvers,
        connectsTo:       lane.connectsTo,
        timestamp:        data.timestamp,
        location:         lane.location
      }));
      
      console.log(`Found ${lanes.length} lanes for intersection`);
      
      return {
        intersectionId:   intersection.intersectionId,
        intersectionName: intersection.intersectionName,
        timestamp:        data.timestamp,
        lanes
      };
    } catch (error) {
      console.error('Error fetching lanes data:', error);
      throw error;
    }
  }

  /**
   * Get lanes for a specific approach direction (simple grouping)
   */
  public static getLanesForApproach(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection
  ): MapEventData[] {
    // may be undefined if no group defined
    const laneIds = APPROACH_LANE_GROUPS[approachDirection];
    
    if (!laneIds) {
      console.warn(`No lane group defined for approach: ${approachDirection}`);
      return [];
    }
    
    const approachLanes = allLanesData.lanes.filter(lane =>
      laneIds.includes(lane.laneId)
    );
    
    console.log(
      `Approach ${approachDirection}: Found lanes [${approachLanes
        .map(l => l.laneId)
        .join(', ')}]`
    );
    
    return approachLanes;
  }

  /**
   * Combine maneuvers for lanes on the same approach (simple OR operation)
   */
  public static combineApproachLaneManeuvers(
    approachLanes: MapEventData[]
  ): AllowedTurn[] {
    if (approachLanes.length === 0) {
      return [];
    }
    
    console.log(`\n🔄 Combining ${approachLanes.length} lanes for this approach...`);
    
    // OR all the bitmasks together
    let combinedBitmask = 0;
    
    approachLanes.forEach(lane => {
      if (lane.maneuvers && lane.maneuvers.length >= 2) {
        const bitmask = lane.maneuvers[1];
        combinedBitmask |= bitmask;
        console.log(
          `Lane ${lane.laneId}: bitmask ${bitmask} (binary: ${bitmask
            .toString(2)
            .padStart(8, '0')})`
        );
      }
    });
    
    console.log(
      `Combined bitmask: ${combinedBitmask} (binary: ${combinedBitmask
        .toString(2)
        .padStart(8, '0')})`
    );
    
    // Decode the combined bitmask (SAE J2735 standard)
    const isUTurnAllowed    = (combinedBitmask & 1) === 1;  // Bit 0
    const isRightAllowed    = (combinedBitmask & 2) === 2;  // Bit 1
    const isLeftAllowed     = (combinedBitmask & 4) === 4;  // Bit 2
    const isStraightAllowed = (combinedBitmask & 8) === 8;  // Bit 3
    
    const result: AllowedTurn[] = [
      { type: TurnType.LEFT,    allowed: isLeftAllowed    },
      { type: TurnType.RIGHT,   allowed: isRightAllowed   },
      { type: TurnType.STRAIGHT,allowed: isStraightAllowed},
      { type: TurnType.U_TURN,  allowed: isUTurnAllowed   },
    ];
    
    console.log('🎯 Combined turns for this approach:');
    result.forEach(turn => {
      console.log(`  ${turn.type}: ${turn.allowed ? '✅' : '❌'}`);
    });
    
    return result;
  }

  /**
   * Process data for a specific approach (simple version)
   */
  public static processApproachData(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection
  ): ProcessedIntersectionData {
    const approachLanes = this.getLanesForApproach(allLanesData, approachDirection);
    const allAllowedTurns = this.combineApproachLaneManeuvers(approachLanes);

    // Safely grab coordinates from the first lane (if any)
    const coordinates: [number, number][] = approachLanes[0]?.location.coordinates
      .map(([lng, lat]) => [lat, lng] as [number, number])
      || [];

    return {
      intersectionId:   allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection,
      allAllowedTurns,
      totalLanes:      approachLanes.length,
      coordinates,
      timestamp:       allLanesData.timestamp,
    };
  }

  /**
   * Legacy alias
   */
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }
}
