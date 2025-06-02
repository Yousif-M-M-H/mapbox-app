// app/src/features/DirectionGuide/services/MapDataService.ts
import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';
import { ApproachPolygon } from '../constants/ApproachPolygonConfig';

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
        intersectionId: intersection.intersectionId,
        intersectionName: intersection.intersectionName,
        laneId: lane.laneId,
        laneAttributes: lane.laneAttributes,
        maneuvers: lane.maneuvers,
        connectsTo: lane.connectsTo,
        timestamp: data.timestamp,
        location: lane.location
      }));
      
      console.log(`Found ${lanes.length} lanes for intersection`);
      
      return {
        intersectionId: intersection.intersectionId,
        intersectionName: intersection.intersectionName,
        timestamp: data.timestamp,
        lanes: lanes
      };
    } catch (error) {
      console.error('Error fetching lanes data:', error);
      throw error;
    }
  }

  /**
   * Get lanes for a specific approach polygon
   */
  public static getLanesForApproachPolygon(allLanesData: MultiLaneMapData, approachPolygon: ApproachPolygon): MapEventData[] {
    const laneIds = approachPolygon.lanes;
    
    if (!laneIds || laneIds.length === 0) {
      console.warn(`No lanes defined for approach polygon: ${approachPolygon.name}`);
      return [];
    }
    
    const approachLanes = allLanesData.lanes.filter(lane => laneIds.includes(lane.laneId));
    
    console.log(`${approachPolygon.name}: Found lanes [${approachLanes.map(l => l.laneId).join(', ')}]`);
    
    return approachLanes;
  }

  /**
   * Combine maneuvers for lanes associated with an approach polygon
   */
  public static combinePolygonLaneManeuvers(approachLanes: MapEventData[]): AllowedTurn[] {
    if (approachLanes.length === 0) {
      return [];
    }
    
    console.log(`\n🔄 Combining ${approachLanes.length} lanes for this approach polygon...`);
    
    // OR all the bitmasks together
    let combinedBitmask = 0;
    
    approachLanes.forEach(lane => {
      if (lane.maneuvers && lane.maneuvers.length >= 2) {
        const bitmask = lane.maneuvers[1];
        combinedBitmask |= bitmask;  // Simple OR operation!
        console.log(`Lane ${lane.laneId}: bitmask ${bitmask} (binary: ${bitmask.toString(2).padStart(8, '0')})`);
      }
    });
    
    console.log(`Combined bitmask: ${combinedBitmask} (binary: ${combinedBitmask.toString(2).padStart(8, '0')})`);
    
    // Decode the combined bitmask (SAE J2735 standard)
    const isUTurnAllowed = (combinedBitmask & 1) === 1;      // Bit 0: U-turn
    const isRightAllowed = (combinedBitmask & 2) === 2;      // Bit 1: Right
    const isLeftAllowed = (combinedBitmask & 4) === 4;       // Bit 2: Left  
    const isStraightAllowed = (combinedBitmask & 8) === 8;   // Bit 3: Straight
    
    const result: AllowedTurn[] = [
      { type: TurnType.LEFT, allowed: isLeftAllowed },
      { type: TurnType.RIGHT, allowed: isRightAllowed },
      { type: TurnType.STRAIGHT, allowed: isStraightAllowed },
      { type: TurnType.U_TURN, allowed: isUTurnAllowed },
    ];
    
    console.log('🎯 Combined turns for this approach polygon:');
    result.forEach(turn => {
      console.log(`  ${turn.type}: ${turn.allowed ? '✅' : '❌'}`);
    });
    
    return result;
  }

  /**
   * Process data for a specific approach polygon (new polygon-based version)
   */
  public static processPolygonApproachData(
    allLanesData: MultiLaneMapData,
    approachPolygon: ApproachPolygon
  ): ProcessedIntersectionData {
    // Get only the lanes associated with this polygon
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    
    // Combine maneuvers for these lanes
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);
    
    // Use coordinates from the first lane (if any)
    const coordinates: [number, number][] = approachLanes[0]?.location.coordinates
      .map(([lng, lat]) => [lat, lng] as [number, number])
      || [];
    
    return {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN, // Not using direction-based detection anymore
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };
  }

  /**
   * Process data for a specific approach (legacy direction-based version)
   */
  public static processApproachData(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection
  ): ProcessedIntersectionData {
    // Legacy method - kept for backwards compatibility
    // Note: This method is deprecated in favor of processPolygonApproachData
    console.warn('processApproachData is deprecated, use processPolygonApproachData instead');
    
    const legacyLaneGroups: Record<ApproachDirection, number[]> = {
      [ApproachDirection.NORTH]: [1, 2],
      [ApproachDirection.SOUTH]: [12, 13],  
      [ApproachDirection.EAST]: [8, 9],
      [ApproachDirection.WEST]: [5, 6],
      [ApproachDirection.UNKNOWN]: [], // Handle UNKNOWN case
    };
    
    const laneIds = legacyLaneGroups[approachDirection] || [];
    const approachLanes = allLanesData.lanes.filter(lane => laneIds.includes(lane.laneId));
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);

    const coordinates: [number, number][] = approachLanes[0]?.location.coordinates
      .map(([lng, lat]) => [lat, lng] as [number, number])
      || [];

    return {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection,
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };
  }

  /**
   * Legacy method
   */
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }
}