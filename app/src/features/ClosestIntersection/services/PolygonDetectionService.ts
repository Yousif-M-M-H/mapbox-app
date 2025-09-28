// app/src/features/ClosestIntersection/services/PolygonDetectionService.ts

import { IntersectionPolygon } from '../constants/IntersectionDefinitions';

export class PolygonDetectionService {
  /**
   * Check if a point is inside a polygon using ray casting algorithm
   * @param point [lat, lng] format
   * @param polygon [lng, lat] format (Mapbox standard)
   */
  static isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
    const [lat, lng] = point;
    let inside = false;
    
    // Convert polygon from [lng, lat] to [lat, lng] for calculation
    const vertices = polygon.map(([lng, lat]) => [lat, lng] as [number, number]);
    
    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
      const [latI, lngI] = vertices[i];
      const [latJ, lngJ] = vertices[j];
      
      if ((latI > lat) !== (latJ > lat) &&
          lng < (lngJ - lngI) * (lat - latI) / (latJ - latI) + lngI) {
        inside = !inside;
      }
    }
    
    return inside;
  }
  
  /**
   * Find which intersection polygon contains the user position
   * @param userPosition [lat, lng] format
   * @param intersections Array of intersection polygons
   */
  static findIntersectionForPosition(
    userPosition: [number, number],
    intersections: IntersectionPolygon[]
  ): IntersectionPolygon | null {
    // Validate user position
    if (!userPosition || userPosition[0] === 0 || userPosition[1] === 0) {
      console.log('🎯 Invalid user position:', userPosition);
      return null;
    }
    
    console.log(`🎯 Checking position [${userPosition[0].toFixed(6)}, ${userPosition[1].toFixed(6)}]`);
    
    for (const intersection of intersections) {
      if (this.isPointInPolygon(userPosition, intersection.polygon)) {
        console.log(`✅ User is inside ${intersection.name} polygon`);
        return intersection;
      }
    }
    
    console.log('❌ User is outside all intersection polygons');
    return null;
  }
  
  /**
   * Debug method to log polygon bounds
   */
  static getPolygonBounds(polygon: [number, number][]): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    // Polygon is in [lng, lat] format
    const lats = polygon.map(([lng, lat]) => lat);
    const lngs = polygon.map(([lng, lat]) => lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }
}