import axios from 'axios';
import { MapEventData, ProcessedIntersectionData } from '../models/IntersectionData';
import { AllowedTurn, ApproachDirection, TurnType } from '../models/DirectionTypes';
import { MAP_DATA_API_URL, MLK_INTERSECTION_ID } from '../constants/TestConstants';

/**
 * Service to handle map data fetching and processing
 */
export class MapDataService {
  /**
   * Fetches intersection data for MLK intersection
   * @returns Promise with MapEventData
   */
  public static async fetchIntersectionData(): Promise<MapEventData> {
    try {
      const endpoint = `${MAP_DATA_API_URL}?intersectionId=${MLK_INTERSECTION_ID}`;
      const response = await axios.get<MapEventData>(endpoint);
      console.log('Fetched intersection data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching map data:', error);
      throw error;
    }
  }

  /**
   * Interprets the maneuvers bitfield to determine allowed turns
   * Based on SAE J2735 standard where:
   * - Bit 1: Left turn
   * - Bit 2: Right turn
   * - Bit 3: U-turn
   * - Bit 4: Straight ahead
   * 
   * @param maneuvers The maneuvers array from API data
   * @returns Array of AllowedTurn objects
   */
  public static interpretManeuvers(maneuvers: number[]): AllowedTurn[] {
    if (!maneuvers || maneuvers.length !== 2) {
      console.warn('Invalid or missing maneuvers data:', maneuvers);
      return [];
    }
    
    // Extract the bitfield value from the maneuvers array
    // In format [startBit, value]
    const bitfieldValue = maneuvers[1];
    
    console.log('Interpreting maneuvers:', maneuvers);
    console.log('Maneuver bitfield value:', bitfieldValue);
    
    // Check which bits are set
    const isLeftAllowed = ((bitfieldValue >> 1) & 1) === 1;
    const isRightAllowed = ((bitfieldValue >> 2) & 1) === 1;
    const isUTurnAllowed = ((bitfieldValue >> 3) & 1) === 1;
    const isStraightAllowed = ((bitfieldValue >> 4) & 1) === 1;
    
    console.log('Turn permissions:', {
      left: isLeftAllowed,
      right: isRightAllowed,
      uTurn: isUTurnAllowed,
      straight: isStraightAllowed,
    });
    
    return [
      { type: TurnType.LEFT, allowed: isLeftAllowed },
      { type: TurnType.RIGHT, allowed: isRightAllowed },
      { type: TurnType.U_TURN, allowed: isUTurnAllowed },
      { type: TurnType.STRAIGHT, allowed: isStraightAllowed },
    ];
  }

  /**
   * Processes raw map data into a format usable by the view model
   * @param rawData Raw map data from API
   * @param approachDirection Calculated approach direction
   * @returns Processed intersection data
   */
  public static processIntersectionData(
    rawData: MapEventData,
    approachDirection: ApproachDirection
  ): ProcessedIntersectionData {
    // Get allowed turns from maneuvers field
    const allowedTurns = this.interpretManeuvers(rawData.maneuvers);
    
    // Convert coordinates if needed (API has [lng, lat] format)
    const coordinates: [number, number][] = rawData.location.coordinates.map(
      coord => [coord[1], coord[0]] as [number, number]
    );
    
    return {
      intersectionId: rawData.intersectionId,
      intersectionName: rawData.intersectionName,
      approachDirection,
      allowedTurns,
      coordinates,
      timestamp: rawData.timestamp,
    };
  }
}