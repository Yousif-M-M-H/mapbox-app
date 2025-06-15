// app/src/testingFeatures/laneShiftTest/utils/CoordinateParser.ts

/**
 * Utility to parse MAP message coordinates
 * Converts from integer format (e.g., 350459367) to decimal degrees (35.0459367)
 */
export class CoordinateParser {
  
  /**
   * Convert MAP coordinate to decimal degrees
   * MAP coordinates are multiplied by 10^7
   */
  static parseCoordinate(mapCoordinate: number): number {
    return mapCoordinate / 10000000;
  }
  
  /**
   * Parse a coordinate pair from MAP format to [longitude, latitude] (GeoJSON format)
   * Same format as CROSSWALK_POLYGON_COORDS
   */
  static parseCoordinatePair(lon: number, lat: number): [number, number] {
    return [
      this.parseCoordinate(lon),   // longitude first
      this.parseCoordinate(lat)    // latitude second
    ];
  }
  
  /**
   * Convert MAP node coordinates to GeoJSON LineString format
   * Returns coordinates in [longitude, latitude] format - SAME AS CROSSWALK
   */
  static parseNodeListToLineString(nodeList: any[]): [number, number][] {
    const coordinates: [number, number][] = [];
    
    console.log('🔍 Parsing node list:', nodeList);
    
    for (const node of nodeList) {
      if (node.delta && node.delta[1]) {
        const deltaData = node.delta[1];
        if (deltaData.lon !== undefined && deltaData.lat !== undefined) {
          // Use parseCoordinatePair to get [longitude, latitude] format
          const coord = this.parseCoordinatePair(deltaData.lon, deltaData.lat);
          coordinates.push(coord);
          
          console.log(`📍 Raw: lon=${deltaData.lon}, lat=${deltaData.lat}`);
          console.log(`📍 Converted: [${coord[0].toFixed(7)}, ${coord[1].toFixed(7)}] (lon, lat)`);
        }
      }
    }
    
    return coordinates;
  }
  
  /**
   * Log coordinates for debugging - compare with crosswalk format
   */
  static logCoordinates(coordinates: [number, number][], laneId: number): void {
    console.log(`🛣️ Lane ${laneId} coordinates (GeoJSON format [lon, lat]) - SAME FORMAT AS CROSSWALK:`);
    coordinates.forEach((coord, index) => {
      console.log(`  Point ${index + 1}: [${coord[0].toFixed(7)}, ${coord[1].toFixed(7)}]`);
    });
    
    // Show coordinate conversion
    console.log(`🔄 Coordinate conversion examples:`);
    console.log(`  -853125954 ÷ 10,000,000 = ${(-853125954 / 10000000).toFixed(7)}`);
    console.log(`  350459207 ÷ 10,000,000 = ${(350459207 / 10000000).toFixed(7)}`);
    console.log(`✅ Using same [longitude, latitude] format as crosswalk polygon`);
  }
}