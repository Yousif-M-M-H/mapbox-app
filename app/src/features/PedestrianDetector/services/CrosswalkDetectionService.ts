// app/src/features/PedestrianDetector/services/CrosswalkDetectionService.ts
// Handles crosswalk polygon detection using point-in-polygon algorithms

import { CROSSWALK_POLYGON_COORDS } from '../../Crosswalk/constants/CrosswalkCoordinates';
import { PedestrianErrorHandler } from '../errorHandling/PedestrianErrorHandler';

export class CrosswalkDetectionService {
  
  /**
   * Check if a pedestrian is inside the crosswalk polygon
   */
  public static isInCrosswalk(coordinates: [number, number]): boolean {
    try {
      return this.isPointInPolygon(coordinates, CROSSWALK_POLYGON_COORDS);
    } catch (error) {
      PedestrianErrorHandler.logError('isInCrosswalk', error);
      return false;
    }
  }
  
  /**
   * Count pedestrians in crosswalk from a list
   */
  public static countPedestriansInCrosswalk(pedestrians: Array<{ coordinates: [number, number] }>): number {
    try {
      return pedestrians.filter(pedestrian => 
        this.isInCrosswalk(pedestrian.coordinates)
      ).length;
    } catch (error) {
      PedestrianErrorHandler.logError('countPedestriansInCrosswalk', error);
      return 0;
    }
  }
  
  /**
   * Get pedestrians that are in crosswalk
   */
  public static getPedestriansInCrosswalk<T extends { coordinates: [number, number] }>(
    pedestrians: T[]
  ): T[] {
    try {
      return pedestrians.filter(pedestrian => 
        this.isInCrosswalk(pedestrian.coordinates)
      );
    } catch (error) {
      PedestrianErrorHandler.logError('getPedestriansInCrosswalk', error);
      return [];
    }
  }
  
  /**
   * Ray casting algorithm to determine if a point is inside a polygon
   * 
   * @param point [lat, lng] - GPS coordinates in [latitude, longitude] format
   * @param polygon [lng, lat][] - Polygon coordinates in [longitude, latitude] format (GeoJSON standard)
   */
  private static isPointInPolygon(
    point: [number, number], 
    polygon: [number, number][]
  ): boolean {
    const [pointLat, pointLng] = point; // GPS: [lat, lng]
    let inside = false;
    
    // ✅ FIXED: Ensure tuples are preserved after reordering
    const vertices: [number, number][] = polygon.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );

    // Handle closed polygon (remove duplicate last point if exists)
    const cleanVertices = this.ensureOpenPolygon(vertices);

    for (let i = 0, j = cleanVertices.length - 1; i < cleanVertices.length; j = i++) {
      const [latI, lngI] = cleanVertices[i];
      const [latJ, lngJ] = cleanVertices[j];

      if (((latI > pointLat) !== (latJ > pointLat)) &&
        (pointLng < (lngJ - lngI) * (pointLat - latI) / (latJ - latI) + lngI)) {
        inside = !inside;
      }
    }

    return inside;
  }
  
  /**
   * Ensure polygon is open (remove duplicate last point if it matches first)
   */
  private static ensureOpenPolygon(vertices: [number, number][]): [number, number][] {
    if (vertices.length > 0 && 
        vertices[0][0] === vertices[vertices.length - 1][0] && 
        vertices[0][1] === vertices[vertices.length - 1][1]) {
      return vertices.slice(0, -1);
    }
    return vertices;
  }
  
  /**
   * Validate coordinates format
   */
  public static validateCoordinates(coordinates: [number, number]): boolean {
    if (!coordinates || coordinates.length !== 2) {
      return false;
    }
    
    const [lat, lng] = coordinates;
    
    // Check for valid coordinate ranges and not NaN
    return !isNaN(lat) && !isNaN(lng) && 
           lat >= -90 && lat <= 90 && 
           lng >= -180 && lng <= 180 &&
           !(lat === 0 && lng === 0); // Exclude null island
  }
  
  /**
   * Get crosswalk polygon bounds for debugging
   */
  public static getCrosswalkBounds(): {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
  } {
    const lats = CROSSWALK_POLYGON_COORDS.map(([lng, lat]) => lat);
    const lngs = CROSSWALK_POLYGON_COORDS.map(([lng, lat]) => lng);
    
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs)
    };
  }
}
