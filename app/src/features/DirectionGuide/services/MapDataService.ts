// app/src/features/DirectionGuide/services/MapDataService.ts
import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';
import { ApproachPolygon } from '../constants/ApproachPolygonConfig';

// API response structure
interface APIResponse {
  intersection: string;
  intersectionId: number | null;
  timestamp: string;
  intersections: Array<{
    intersectionId: number;
    intersectionName: string;
    refPoint: { lat: number; lon: number; };
    lanes: Array<{
      laneId: number;
      laneAttributes: any;
      maneuvers: number[];
      connectsTo: Array<{
        connectingLane: { lane: number };
        signalGroup: number;
      }>;
      location: { type: string; coordinates: [number, number][]; };
    }>;
  }>;
}

export class MapDataService {
  /**
   * Fetch intersection data - clean and simple
   */
  public static async fetchAllLanesData(): Promise<MultiLaneMapData> {
    try {
      console.log('📡 Fetching intersection data...');
      
      const response = await fetch(MAP_DATA_API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: APIResponse = await response.json();
      console.log('📡 API Response received');
      
      const intersection = data.intersections.find(i => i.intersectionId === MLK_INTERSECTION_ID);
      if (!intersection) {
        throw new Error(`Intersection ${MLK_INTERSECTION_ID} not found`);
      }
      
      console.log(`🏗️ Found: ${intersection.intersectionName}`);
      
      // Convert to our format (no complex analysis needed)
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
      
      return {
        intersectionId: intersection.intersectionId,
        intersectionName: intersection.intersectionName,
        timestamp: data.timestamp,
        lanes: lanes
      };
    } catch (error) {
      console.error('📡 API Error:', error);
      throw error;
    }
  }

  /**
   * Get lanes for approach - simple filtering
   */
  public static getLanesForApproachPolygon(
    allLanesData: MultiLaneMapData, 
    approachPolygon: ApproachPolygon
  ): MapEventData[] {
    const foundLanes = allLanesData.lanes.filter(lane => 
      approachPolygon.lanes.includes(lane.laneId)
    );
    
    console.log(`🔍 ${approachPolygon.name}: Found ${foundLanes.length} lanes`);
    return foundLanes;
  }

  /**
   * Combine turn permissions - this is what matters!
   */
  public static combinePolygonLaneManeuvers(approachLanes: MapEventData[]): AllowedTurn[] {
    if (approachLanes.length === 0) {
      console.log('⚠️ No lanes provided');
      return this.getDefaultTurns();
    }
    
    console.log(`🔄 Processing ${approachLanes.length} lanes for turn permissions:`);
    
    let combinedBitmask = 0;
    
    approachLanes.forEach(lane => {
      const bitmask = lane.maneuvers[1]; // Index 1 has the maneuver data
      combinedBitmask |= bitmask;
      
      console.log(`  Lane ${lane.laneId}: bitmask ${bitmask} (${bitmask.toString(2).padStart(8, '0')})`);
    });
    
    console.log(`🔄 Combined: ${combinedBitmask} (${combinedBitmask.toString(2).padStart(8, '0')})`);
    
    // Decode SAE J2735 standard bitmask
    const turns: AllowedTurn[] = [
      { type: TurnType.U_TURN, allowed: (combinedBitmask & 1) === 1 },     // Bit 0
      { type: TurnType.RIGHT, allowed: (combinedBitmask & 2) === 2 },      // Bit 1  
      { type: TurnType.LEFT, allowed: (combinedBitmask & 4) === 4 },       // Bit 2
      { type: TurnType.STRAIGHT, allowed: (combinedBitmask & 8) === 8 },   // Bit 3
    ];
    
    const allowedTurns = turns.filter(t => t.allowed);
    console.log(`✅ Turns available: ${allowedTurns.map(t => t.type).join(', ')}`);
    
    return turns;
  }

  /**
   * Process approach - focused on what the driver needs
   */
  public static processPolygonApproachData(
    allLanesData: MultiLaneMapData,
    approachPolygon: ApproachPolygon
  ): ProcessedIntersectionData {
    console.log(`🏗️ Processing: ${approachPolygon.name}`);
    
    // Get lanes for this approach
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    
    // Get turn permissions - this is what matters!
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);
    
    // Simple result for UI
    const result: ProcessedIntersectionData = {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN,
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates: [], // Not needed for turn display
      timestamp: allLanesData.timestamp,
    };
    
    console.log(`✅ ${approachPolygon.name}: ${allAllowedTurns.filter(t => t.allowed).length} turns available`);
    
    return result;
  }

  /**
   * Get signal groups (for future SPaT integration)
   */
  public static getSignalGroupsForApproach(
    allLanesData: MultiLaneMapData,
    approachPolygon: ApproachPolygon
  ): number[] {
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    const signalGroups = [...new Set(approachLanes.flatMap(lane => 
      lane.connectsTo.map(c => c.signalGroup)
    ))];
    
    console.log(`📶 Signal groups for ${approachPolygon.name}: [${signalGroups.join(',')}]`);
    return signalGroups;
  }

  /**
   * Default turns for error cases
   */
  private static getDefaultTurns(): AllowedTurn[] {
    return [
      { type: TurnType.LEFT, allowed: true },
      { type: TurnType.STRAIGHT, allowed: true },
      { type: TurnType.RIGHT, allowed: false },
      { type: TurnType.U_TURN, allowed: false },
    ];
  }

  // Legacy method for backward compatibility
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }
}