// app/src/features/DirectionGuide/utils/PolygonDetectionUtils.ts
import { ApproachPolygon, MLK_APPROACH_POLYGONS } from '../constants/ApproachPolygonConfig';

/**
 * Determine if a point is inside a polygon using ray casting algorithm
 * @param point [latitude, longitude] 
 * @param polygon Array of [longitude, latitude] coordinates
 * @returns true if point is inside polygon
 */
export const isPointInPolygon = (
  point: [number, number], 
  polygon: [number, number][]
): boolean => {
  const [lat, lng] = point;  // Point is [lat, lng]
  let inside = false;
  
  // Convert polygon from [lng, lat] to [lat, lng] for consistent comparison
  const vertices = polygon.map(([lng, lat]) => [lat, lng]);
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [xi, yi] = vertices[i];
    const [xj, yj] = vertices[j];
    
    if (((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  
  return inside;
};

/**
 * Find which approach polygon contains the given vehicle position
 * @param vehiclePosition [latitude, longitude]
 * @returns ApproachPolygon if found, null if vehicle not in any approach zone
 */
export const detectApproachPolygon = (
  vehiclePosition: [number, number]
): ApproachPolygon | null => {
  // Check each approach polygon
  for (const polygon of MLK_APPROACH_POLYGONS) {
    if (isPointInPolygon(vehiclePosition, polygon.detectionZone)) {
      console.log(`🎯 Vehicle detected in ${polygon.name}`);
      return polygon;
    }
  }
  
  console.log(`📍 Vehicle not in any approach zone: [${vehiclePosition[0]}, ${vehiclePosition[1]}]`);
  return null;
};

/**
 * Get distance from point to polygon center (for debugging/proximity checks)
 * @param point [latitude, longitude]
 * @param polygon [longitude, latitude] coordinates
 * @returns distance in coordinate units
 */
export const getDistanceToPolygonCenter = (
  point: [number, number],
  polygon: [number, number][]
): number => {
  // Calculate polygon center
  const centerLng = polygon.reduce((sum, [lng]) => sum + lng, 0) / polygon.length;
  const centerLat = polygon.reduce((sum, [lng, lat]) => sum + lat, 0) / polygon.length;
  
  const [pointLat, pointLng] = point;
  
  // Simple distance calculation
  return Math.sqrt(
    Math.pow(pointLat - centerLat, 2) + 
    Math.pow(pointLng - centerLng, 2)
  );
};

/**
 * Log detailed polygon detection information for debugging
 */
export const logPolygonDetectionDetails = (
  vehiclePosition: [number, number]
): void => {
  console.log('\n🔍 === POLYGON DETECTION DEBUG ===');
  console.log(`Vehicle Position: [${vehiclePosition[0]}, ${vehiclePosition[1]}]`);
  
  MLK_APPROACH_POLYGONS.forEach(polygon => {
    const isInside = isPointInPolygon(vehiclePosition, polygon.detectionZone);
    const distance = getDistanceToPolygonCenter(vehiclePosition, polygon.detectionZone);
    
    console.log(`${polygon.name}:`);
    console.log(`  - Inside: ${isInside ? '✅' : '❌'}`);
    console.log(`  - Distance to center: ${(distance * 100000).toFixed(2)}m`);
    console.log(`  - Associated lanes: [${polygon.lanes.join(', ')}]`);
  });
  
  console.log('🔍 === END POLYGON DETECTION ===\n');
};