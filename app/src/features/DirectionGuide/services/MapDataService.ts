// app/src/features/DirectionGuide/services/MapDataService.ts
import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';

/**
 * Service to handle map data fetching and processing
 */
export class MapDataService {
  /**
   * Fetches ALL lanes data for MLK intersection
   * @returns Promise with all lanes data
   */
  public static async fetchAllLanesData(): Promise<MultiLaneMapData> {
    try {
      // Fetch without laneId filter to get all lanes
      const endpoint = `${MAP_DATA_API_URL}?intersectionId=${MLK_INTERSECTION_ID}`;
      console.log('Fetching all lanes data from:', endpoint);
      
      // Create abort controller for timeout (React Native compatible)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds for multiple lanes
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw API response:', data);
      
      // Handle different response formats
      let lanes: MapEventData[] = [];
      
      if (Array.isArray(data)) {
        // If API returns array of lane objects
        lanes = data;
      } else if (data.lanes && Array.isArray(data.lanes)) {
        // If API returns {lanes: [...]}
        lanes = data.lanes;
      } else if (data.intersectionId) {
        // If API returns single lane object, wrap in array
        lanes = [data as MapEventData];
      } else {
        throw new Error('Unexpected API response format');
      }
      
      // Create MultiLaneMapData structure
      const multiLaneData: MultiLaneMapData = {
        intersectionId: lanes[0]?.intersectionId || MLK_INTERSECTION_ID,
        intersectionName: lanes[0]?.intersectionName || 'MLK - Central Ave.',
        timestamp: lanes[0]?.timestamp || new Date().toISOString(),
        lanes: lanes
      };
      
      console.log(`Found ${lanes.length} lanes for intersection ${multiLaneData.intersectionId}`);
      lanes.forEach((lane, index) => {
        console.log(`Lane ${index + 1} (ID: ${lane.laneId}): maneuvers [${lane.maneuvers.join(', ')}]`);
      });
      
      return multiLaneData;
    } catch (error) {
      console.error('Error fetching all lanes data:', error);
      throw error;
    }
  }

  /**
   * Interprets the maneuvers bitfield to determine allowed turns
   * @param maneuvers The maneuvers array from API data
   * @returns Array of AllowedTurn objects
   */
  public static interpretManeuvers(maneuvers: number[]): AllowedTurn[] {
    if (!maneuvers || maneuvers.length !== 2) {
      console.warn('Invalid or missing maneuvers data:', maneuvers);
      return [];
    }
    
    const bitfieldValue = maneuvers[1];
    
    // Check which bits are set
    const isLeftAllowed = ((bitfieldValue >> 1) & 1) === 1;
    const isRightAllowed = ((bitfieldValue >> 2) & 1) === 1;
    const isUTurnAllowed = ((bitfieldValue >> 3) & 1) === 1;
    const isStraightAllowed = ((bitfieldValue >> 4) & 1) === 1;
    
    return [
      { type: TurnType.LEFT, allowed: isLeftAllowed },
      { type: TurnType.RIGHT, allowed: isRightAllowed },
      { type: TurnType.U_TURN, allowed: isUTurnAllowed },
      { type: TurnType.STRAIGHT, allowed: isStraightAllowed },
    ];
  }

  /**
   * Combine maneuvers from all lanes to create union of all allowed turns
   * @param allLanesData Data from all lanes
   * @returns Combined AllowedTurn array with union of all possibilities
   */
  public static combineAllLaneManeuvers(allLanesData: MultiLaneMapData): AllowedTurn[] {
    console.log('\n🔄 Combining maneuvers from all lanes...');
    
    // Initialize all turns as not allowed
    const combinedTurns = {
      [TurnType.LEFT]: false,
      [TurnType.RIGHT]: false,
      [TurnType.STRAIGHT]: false,
      [TurnType.U_TURN]: false,
    };
    
    // Process each lane
    allLanesData.lanes.forEach((lane, index) => {
      console.log(`Processing Lane ${index + 1} (ID: ${lane.laneId}):`);
      const laneAllowedTurns = this.interpretManeuvers(lane.maneuvers);
      
      // Union: if ANY lane allows a turn, it's available
      laneAllowedTurns.forEach(turn => {
        if (turn.allowed) {
          combinedTurns[turn.type] = true;
          console.log(`  ✅ ${turn.type} allowed in lane ${lane.laneId}`);
        }
      });
    });
    
    // Convert back to AllowedTurn array
    const result: AllowedTurn[] = [
      { type: TurnType.LEFT, allowed: combinedTurns[TurnType.LEFT] },
      { type: TurnType.RIGHT, allowed: combinedTurns[TurnType.RIGHT] },
      { type: TurnType.STRAIGHT, allowed: combinedTurns[TurnType.STRAIGHT] },
      { type: TurnType.U_TURN, allowed: combinedTurns[TurnType.U_TURN] },
    ];
    
    // Log final result
    console.log('\n🎯 Final combined allowed turns:');
    result.forEach(turn => {
      console.log(`  ${turn.type}: ${turn.allowed ? '✅ ALLOWED' : '❌ NOT ALLOWED'}`);
    });
    
    return result;
  }

  /**
   * Processes all lanes data into a format usable by the view model
   * @param allLanesData Raw data from all lanes
   * @param approachDirection Calculated approach direction
   * @returns Processed intersection data with combined turns
   */
  public static processAllLanesData(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection
  ): ProcessedIntersectionData {
    // Get combined allowed turns from all lanes
    const allAllowedTurns = this.combineAllLaneManeuvers(allLanesData);
    
    // Use coordinates from the first lane (they should be similar for the same intersection)
    const coordinates: [number, number][] = allLanesData.lanes[0]?.location.coordinates.map(
      coord => [coord[1], coord[0]] as [number, number]
    ) || [];
    
    return {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection,
      allAllowedTurns,
      totalLanes: allLanesData.lanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };
  }

  /**
   * Legacy method - now uses the new all-lanes approach
   * @deprecated Use fetchAllLanesData instead
   */
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }
}