// app/src/testingFeatures/laneShiftTest/services/MAPParserService.ts

import { ParsedLane, TestLaneData } from '../models/LaneModels';

export class MAPParserService {
  
  /**
   * Simple test - just return hardcoded coordinates for a line
   */
  static parseTestLane(): TestLaneData {
    console.log('🛣️ SIMPLE LINE TEST: Creating line between two points');
    
    // Hardcoded coordinates - Mapbox format [longitude, latitude]
    const coordinates: [number, number][] = [
      [-85.3125954, 35.0459207], // Point 1
      [-85.3132786, 35.0448121]  // Point 2
    ];
    
    console.log('🛣️ Point 1:', coordinates[0]);
    console.log('🛣️ Point 2:', coordinates[1]);
    
    const parsedLane: ParsedLane = {
      laneID: 17,
      approach: 6,
      type: 'ingress',
      coordinates: coordinates,
      rawData: 'simple_test'
    };
    
    console.log('✅ Simple line data created successfully');
    
    return {
      selectedLane: parsedLane,
      intersectionId: 52349,
      refPoint: [-85.3129370, 35.0453664], // Center of the two points
      testStatus: 'success'
    };
  }
  
  /**
   * Get a GeoJSON LineString for the parsed lane
   */
  static getLaneAsGeoJSON(lane: ParsedLane): any {
    console.log('🛣️ Creating GeoJSON for line rendering');
    
    const geoJSON = {
      type: 'Feature',
      properties: {
        laneID: lane.laneID
      },
      geometry: {
        type: 'LineString',
        coordinates: lane.coordinates
      }
    };
    
    console.log('🛣️ GeoJSON created:', JSON.stringify(geoJSON, null, 2));
    return geoJSON;
  }
}