// app/src/features/DirectionGuide/services/MapDataService.ts
import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';
import { ApproachPolygon } from '../constants/ApproachPolygonConfig';

// API response structure from your data
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
      laneAttributes: {
        directionalUse: number[];
        sharedWith: number[];
        laneType: [string, number[]];
      };
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
   * Fetch lanes data from your API
   */
  public static async fetchAllLanesData(): Promise<MultiLaneMapData> {
    try {
      console.log('Fetching from:', MAP_DATA_API_URL);
      
      const response = await fetch(MAP_DATA_API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: APIResponse = await response.json();
      console.log('API Response received');
      
      if (!data.intersections || data.intersections.length === 0) {
        throw new Error('No intersections in response');
      }
      
      // Find our specific intersection
      const intersection = data.intersections.find(i => i.intersectionId === MLK_INTERSECTION_ID);
      if (!intersection) {
        console.log('Available intersections:', data.intersections.map(i => `${i.intersectionId}: ${i.intersectionName}`));
        throw new Error(`Intersection ${MLK_INTERSECTION_ID} not found`);
      }
      
      console.log(`Found intersection: ${intersection.intersectionName}`);
      console.log(`Total lanes: ${intersection.lanes.length}`);
      
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
      
      return {
        intersectionId: intersection.intersectionId,
        intersectionName: intersection.intersectionName,
        timestamp: data.timestamp,
        lanes: lanes
      };
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get lanes for approach polygon
   */
  public static getLanesForApproachPolygon(allLanesData: MultiLaneMapData, approachPolygon: ApproachPolygon): MapEventData[] {
    const targetLaneIds = approachPolygon.lanes;
    const foundLanes = allLanesData.lanes.filter(lane => targetLaneIds.includes(lane.laneId));
    
    console.log(`Looking for lanes [${targetLaneIds.join(', ')}]`);
    console.log(`Found lanes [${foundLanes.map(l => l.laneId).join(', ')}]`);
    
    if (foundLanes.length === 0) {
      const availableLanes = allLanesData.lanes.map(l => l.laneId);
      console.log(`Available lanes: [${availableLanes.join(', ')}]`);
    }
    
    return foundLanes;
  }

  /**
   * Decode maneuvers from lanes
   */
  public static combinePolygonLaneManeuvers(approachLanes: MapEventData[]): AllowedTurn[] {
    if (approachLanes.length === 0) {
      console.log('No lanes found, using defaults');
      return [
        { type: TurnType.LEFT, allowed: true },
        { type: TurnType.STRAIGHT, allowed: true },
        { type: TurnType.RIGHT, allowed: false },
        { type: TurnType.U_TURN, allowed: false },
      ];
    }
    
    console.log(`Decoding maneuvers for ${approachLanes.length} lanes`);
    
    let combinedBitmask = 0;
    
    approachLanes.forEach(lane => {
      if (lane.maneuvers && lane.maneuvers.length >= 2) {
        const bitmask = lane.maneuvers[1]; // Your data has [0, 12] - use index 1
        combinedBitmask |= bitmask;
        console.log(`Lane ${lane.laneId}: maneuvers=${JSON.stringify(lane.maneuvers)}, bitmask=${bitmask}`);
      }
    });
    
    console.log(`Combined bitmask: ${combinedBitmask} (binary: ${combinedBitmask.toString(2).padStart(8, '0')})`);
    
    // Decode using SAE J2735 standard
    const turns: AllowedTurn[] = [
      { type: TurnType.U_TURN, allowed: (combinedBitmask & 1) === 1 },     // Bit 0
      { type: TurnType.RIGHT, allowed: (combinedBitmask & 2) === 2 },      // Bit 1  
      { type: TurnType.LEFT, allowed: (combinedBitmask & 4) === 4 },       // Bit 2
      { type: TurnType.STRAIGHT, allowed: (combinedBitmask & 8) === 8 },   // Bit 3
    ];
    
    const allowedTurns = turns.filter(t => t.allowed).map(t => t.type);
    console.log(`Allowed turns: ${allowedTurns.join(', ')}`);
    
    return turns;
  }

  /**
   * Process data for polygon approach
   */
  public static processPolygonApproachData(
    allLanesData: MultiLaneMapData,
    approachPolygon: ApproachPolygon
  ): ProcessedIntersectionData {
    console.log(`Processing ${approachPolygon.name}`);
    
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);
    
    // Get coordinates from first lane
    const coordinates: [number, number][] = approachLanes[0]?.location.coordinates
      .map(([lng, lat]) => [lat, lng] as [number, number]) || [];
    
    const result: ProcessedIntersectionData = {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN,
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };
    
    console.log(`Result: ${result.totalLanes} lanes, ${allAllowedTurns.filter(t => t.allowed).length} allowed turns`);
    return result;
  }

  // Legacy methods for compatibility
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }

  public static processApproachData(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection
  ): ProcessedIntersectionData {
    // Legacy - redirect to polygon-based approach
    const defaultPolygon: ApproachPolygon = {
      id: 'legacy',
      name: 'Legacy Approach',
      lanes: [1, 2],
      signalGroups: [3, 4],
      detectionZone: []
    };
    return this.processPolygonApproachData(allLanesData, defaultPolygon);
  }
}