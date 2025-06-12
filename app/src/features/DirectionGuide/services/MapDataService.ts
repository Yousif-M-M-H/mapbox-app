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
   * Fetch lanes data from your API (reusable for all lane groups)
   */
  public static async fetchAllLanesData(): Promise<MultiLaneMapData> {
    try {
      console.log('📡 Fetching intersection data from:', MAP_DATA_API_URL);
      
      const response = await fetch(MAP_DATA_API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: APIResponse = await response.json();
      console.log('📡 API Response received');
      
      if (!data.intersections || data.intersections.length === 0) {
        throw new Error('No intersections in response');
      }
      
      // Find our specific intersection
      const intersection = data.intersections.find(i => i.intersectionId === MLK_INTERSECTION_ID);
      if (!intersection) {
        console.log('Available intersections:', data.intersections.map(i => `${i.intersectionId}: ${i.intersectionName}`));
        throw new Error(`Intersection ${MLK_INTERSECTION_ID} not found`);
      }
      
      console.log(`🏗️ Found intersection: ${intersection.intersectionName}`);
      console.log(`🛣️ Total lanes available: ${intersection.lanes.length}`);
      
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
      
      // Log lane summary
      console.log(`🛣️ Lanes 1-4 status:`);
      [1, 2, 3, 4].forEach(laneId => {
        const lane = lanes.find(l => l.laneId === laneId);
        if (lane) {
          const signalGroups = lane.connectsTo.map(c => c.signalGroup);
          console.log(`  Lane ${laneId}: maneuvers=${JSON.stringify(lane.maneuvers)}, signals=[${signalGroups.join(',')}]`);
        } else {
          console.log(`  Lane ${laneId}: NOT FOUND`);
        }
      });
      
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
   * Enhanced lane filtering for any approach polygon
   */
  public static getLanesForApproachPolygon(
    allLanesData: MultiLaneMapData, 
    approachPolygon: ApproachPolygon
  ): MapEventData[] {
    const targetLaneIds = approachPolygon.lanes;
    const foundLanes = allLanesData.lanes.filter(lane => targetLaneIds.includes(lane.laneId));
    
    console.log(`🔍 ${approachPolygon.name}:`);
    console.log(`  Searching for lanes: [${targetLaneIds.join(', ')}]`);
    console.log(`  Found lanes: [${foundLanes.map(l => l.laneId).join(', ')}]`);
    
    if (foundLanes.length === 0) {
      const availableLanes = allLanesData.lanes.map(l => l.laneId);
      console.warn(`  ⚠️ No matching lanes found! Available: [${availableLanes.join(', ')}]`);
    } else {
      console.log(`  ✅ Successfully found ${foundLanes.length}/${targetLaneIds.length} lanes`);
    }
    
    return foundLanes;
  }

  /**
   * Enhanced maneuver combination with signal group handling
   */
  public static combinePolygonLaneManeuvers(approachLanes: MapEventData[]): AllowedTurn[] {
    if (approachLanes.length === 0) {
      console.log('⚠️ No lanes provided, using default turn permissions');
      return this.getDefaultTurns();
    }
    
    console.log(`🔄 Processing maneuvers for ${approachLanes.length} lanes:`);
    
    let combinedBitmask = 0;
    const laneDetails: Array<{id: number, bitmask: number, signalGroups: number[]}> = [];
    
    approachLanes.forEach(lane => {
      if (lane.maneuvers && lane.maneuvers.length >= 2) {
        const bitmask = lane.maneuvers[1]; // Index 1 contains the maneuver bitmask
        combinedBitmask |= bitmask;
        
        const signalGroups = lane.connectsTo.map(c => c.signalGroup);
        laneDetails.push({
          id: lane.laneId,
          bitmask: bitmask,
          signalGroups: signalGroups
        });
        
        console.log(`  Lane ${lane.laneId}: bitmask=${bitmask} (${bitmask.toString(2).padStart(8, '0')}), signals=[${signalGroups.join(',')}]`);
      } else {
        console.warn(`  Lane ${lane.laneId}: Invalid maneuvers data=${JSON.stringify(lane.maneuvers)}`);
      }
    });
    
    console.log(`🔄 Combined bitmask: ${combinedBitmask} (binary: ${combinedBitmask.toString(2).padStart(8, '0')})`);
    
    // Decode using SAE J2735 standard
    const turns: AllowedTurn[] = [
      { type: TurnType.U_TURN, allowed: (combinedBitmask & 1) === 1 },     // Bit 0
      { type: TurnType.RIGHT, allowed: (combinedBitmask & 2) === 2 },      // Bit 1  
      { type: TurnType.LEFT, allowed: (combinedBitmask & 4) === 4 },       // Bit 2
      { type: TurnType.STRAIGHT, allowed: (combinedBitmask & 8) === 8 },   // Bit 3
    ];
    
    const allowedTurns = turns.filter(t => t.allowed);
    console.log(`✅ Allowed turns: ${allowedTurns.map(t => t.type).join(', ')}`);
    
    // Log signal group summary
    const allSignalGroups = [...new Set(laneDetails.flatMap(l => l.signalGroups))];
    console.log(`📶 Signal groups involved: [${allSignalGroups.join(', ')}]${allSignalGroups.length === 0 ? ' (None - no SPaT integration)' : ''}`);
    
    return turns;
  }

  /**
   * Default turn permissions when no data available
   */
  private static getDefaultTurns(): AllowedTurn[] {
    return [
      { type: TurnType.LEFT, allowed: true },
      { type: TurnType.STRAIGHT, allowed: true },
      { type: TurnType.RIGHT, allowed: false },
      { type: TurnType.U_TURN, allowed: false },
    ];
  }

  /**
   * Enhanced polygon approach processing (works for any lane group)
   */
  public static processPolygonApproachData(
    allLanesData: MultiLaneMapData,
    approachPolygon: ApproachPolygon
  ): ProcessedIntersectionData {
    console.log(`🏗️ Processing: ${approachPolygon.name}`);
    
    // Get lanes for this specific approach
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    
    // Process maneuvers
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);
    
    // Get coordinates from first available lane
    const coordinates: [number, number][] = approachLanes.length > 0 
      ? approachLanes[0].location.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
      : [];
    
    // Determine signal groups for SPaT integration
    const signalGroups = [...new Set(approachLanes.flatMap(lane => 
      lane.connectsTo.map(c => c.signalGroup)
    ))];
    
    const result: ProcessedIntersectionData = {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN, // Could be enhanced with heading calculation
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };
    
    console.log(`✅ ${approachPolygon.name} processed:`);
    console.log(`   Lanes: ${result.totalLanes}, Turns: ${allAllowedTurns.filter(t => t.allowed).length}, Signals: [${signalGroups.join(',')}]`);
    
    return result;
  }

  /**
   * Get signal groups for an approach (useful for SPaT integration)
   */
  public static getSignalGroupsForApproach(
    allLanesData: MultiLaneMapData,
    approachPolygon: ApproachPolygon
  ): number[] {
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    return [...new Set(approachLanes.flatMap(lane => 
      lane.connectsTo.map(c => c.signalGroup)
    ))];
  }

  // Legacy methods for backward compatibility
  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }

  public static processApproachData(
    allLanesData: MultiLaneMapData,
    approachDirection: ApproachDirection
  ): ProcessedIntersectionData {
    // Legacy fallback - use first available polygon
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