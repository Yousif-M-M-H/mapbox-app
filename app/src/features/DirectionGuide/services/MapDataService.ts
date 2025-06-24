import { MapEventData, MultiLaneMapData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';
import { ApproachPolygon } from '../constants/ApproachPolygonConfig';

// Hardcoded accurate coordinates for lane groups (temporary until backend is fixed)
const LANE_GROUP_COORDINATES = {
  "lanes_8_9": {
    lanes: [8, 9],
    coordinates: [
      [-85.29223847085184, 35.03985800284322], // Lane 8 start
      [-85.29269224059195, 35.04002597941502], // Lane 8 end
      [-85.2922264, 35.0397893],               // Lane 9 start
      [-85.2941284, 35.0404962]                // Lane 9 end
    ]
  }
};

export class MapDataService {
  public static detectApproachingLaneGroup(carPosition: [number, number]): number[] {
    const DETECTION_DISTANCE = 0.001;
    const laneGroup = LANE_GROUP_COORDINATES["lanes_8_9"];
    const isNearLaneGroup = laneGroup.coordinates.some(coord => {
      const distance = this.calculateDistance(carPosition, [coord[1], coord[0]]);
      return distance < DETECTION_DISTANCE;
    });

    if (isNearLaneGroup) {
      console.log(`🛣️ Car approaching lanes ${laneGroup.lanes.join(' & ')}`);
      return laneGroup.lanes;
    }

    console.log(`🛣️ Car not near any lane groups`);
    return [];
  }

  private static calculateDistance(point1: [number, number], point2: [number, number]): number {
    const [lat1, lng1] = point1;
    const [lat2, lng2] = point2;
    return Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
  }

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

      const data = await response.json();
      console.log('📡 API Response received');

      if (!data.intersections || data.intersections.length === 0) {
        throw new Error('No intersections in response');
      }

      const intersection = data.intersections.find((i: any) => i.intersectionId === MLK_INTERSECTION_ID);

      if (!intersection) {
        throw new Error(`Intersection ${MLK_INTERSECTION_ID} not found`);
      }

      console.log(`🏗️ Found intersection: ${intersection.intersectionName} (ID: ${intersection.intersectionId})`);
      console.log(`🛣️ Total lanes available: ${intersection.lanes.length}`);

      const lanes: MapEventData[] = intersection.lanes.map((lane: any) => ({
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

  public static getLanesForCarPosition(allLanesData: MultiLaneMapData, carPosition: [number, number]): MapEventData[] {
    const laneGroupIds = this.detectApproachingLaneGroup(carPosition);
    const foundLanes = allLanesData.lanes.filter(lane => laneGroupIds.includes(lane.laneId));

    console.log(`🔍 Car at [${carPosition[0].toFixed(6)}, ${carPosition[1].toFixed(6)}]`);
    if (laneGroupIds.length > 0) {
      console.log(`📊 Found lane group data for lanes: ${laneGroupIds.join(' & ')}`);
    } else {
      console.log(`📊 No lane groups detected at this position`);
    }

    return foundLanes;
  }

  public static processCarPositionData(allLanesData: MultiLaneMapData, carPosition: [number, number]): ProcessedIntersectionData {
    const approachLanes = this.getLanesForCarPosition(allLanesData, carPosition);
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);

    const coordinates: [number, number][] = approachLanes.length > 0 
      ? approachLanes[0].location.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
      : [];

    const result: ProcessedIntersectionData = {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN,
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };

    if (approachLanes.length > 0) {
      const allowedTurnTypes = allAllowedTurns.filter(t => t.allowed).map(t => t.type);
      console.log(`✅ Lane group processing complete:`);
      console.log(`   Combined data from lanes: ${approachLanes.map(l => l.laneId).join(' & ')}`);
      console.log(`   Combined allowed turns: ${allowedTurnTypes.join(', ') || 'None'}`);
    } else {
      console.log(`ℹ️ No lane group detected - no turn data available`);
    }

    return result;
  }

  public static combinePolygonLaneManeuvers(approachLanes: MapEventData[]): AllowedTurn[] {
    if (approachLanes.length === 0) {
      return this.getDefaultTurns();
    }

    let combinedBitmask = 0;

    approachLanes.forEach(lane => {
      if (lane.maneuvers && lane.maneuvers.length >= 2) {
        const bitmask = lane.maneuvers[1];
        combinedBitmask |= bitmask;
      }
    });

    const turns: AllowedTurn[] = [
      { type: TurnType.U_TURN, allowed: (combinedBitmask & 1) === 1 },
      { type: TurnType.RIGHT, allowed: (combinedBitmask & 2) === 2 },
      { type: TurnType.LEFT, allowed: (combinedBitmask & 4) === 4 },
      { type: TurnType.STRAIGHT, allowed: (combinedBitmask & 8) === 8 },
    ];

    return turns;
  }

  private static getDefaultTurns(): AllowedTurn[] {
    return [
      { type: TurnType.LEFT, allowed: true },
      { type: TurnType.STRAIGHT, allowed: true },
      { type: TurnType.RIGHT, allowed: false },
      { type: TurnType.U_TURN, allowed: false },
    ];
  }

  public static processPolygonApproachData(allLanesData: MultiLaneMapData, approachPolygon: ApproachPolygon): ProcessedIntersectionData {
    const approachLanes = this.getLanesForApproachPolygon(allLanesData, approachPolygon);
    const allAllowedTurns = this.combinePolygonLaneManeuvers(approachLanes);

    const coordinates: [number, number][] = approachLanes.length > 0 
      ? approachLanes[0].location.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
      : [];

    return {
      intersectionId: allLanesData.intersectionId,
      intersectionName: allLanesData.intersectionName,
      approachDirection: ApproachDirection.UNKNOWN,
      allAllowedTurns,
      totalLanes: approachLanes.length,
      coordinates,
      timestamp: allLanesData.timestamp,
    };
  }

  public static getLanesForApproachPolygon(allLanesData: MultiLaneMapData, approachPolygon: ApproachPolygon): MapEventData[] {
    const targetLaneIds = approachPolygon.lanes;
    const foundLanes = allLanesData.lanes.filter(lane => targetLaneIds.includes(lane.laneId));
    console.log(`🔍 ${approachPolygon.name}: Found ${foundLanes.length}/${targetLaneIds.length} lanes`);
    return foundLanes;
  }

  public static async fetchIntersectionData(): Promise<MultiLaneMapData> {
    return this.fetchAllLanesData();
  }

  public static processApproachData(allLanesData: MultiLaneMapData, approachDirection: ApproachDirection, carPosition: [number, number] = [35.0393478, -85.2920799]): ProcessedIntersectionData {
    return this.processCarPositionData(allLanesData, carPosition);
  }
}
