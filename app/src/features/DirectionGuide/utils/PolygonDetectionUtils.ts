// app/src/features/DirectionGuide/utils/PolygonDetectionUtils.ts
import { ApproachPolygon, MLK_APPROACH_POLYGONS } from '../constants/ApproachPolygonConfig';

/**
 * Point-in-polygon detection using ray casting algorithm
 * 
 * @param point [lat, lng] - GPS coordinates in [latitude, longitude] format
 * @param polygon [lng, lat][] - Polygon coordinates in [longitude, latitude] format (GeoJSON standard)
 */
export const isPointInPolygon = (
  point: [number, number], 
  polygon: [number, number][]
): boolean => {
  const [pointLat, pointLng] = point; // GPS: [lat, lng]
  let inside = false;
  
  // Polygon coordinates are in [lng, lat] format, so we need to swap them for comparison
  const vertices = polygon.map(([lng, lat]) => [lat, lng]); // Convert to [lat, lng] for consistency
  
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const [latI, lngI] = vertices[i];
    const [latJ, lngJ] = vertices[j];
    
    if (((latI > pointLat) !== (latJ > pointLat)) && 
        (pointLng < (lngJ - lngI) * (pointLat - latI) / (latJ - latI) + lngI)) {
      inside = !inside;
    }
  }
  
  return inside;
};

/**
 * Find which approach polygon contains the vehicle
 * 
 * @param vehiclePosition [lat, lng] - GPS coordinates in [latitude, longitude] format
 */
export const detectApproachPolygon = (
  vehiclePosition: [number, number]
): ApproachPolygon | null => {
  console.log(`🔍 Testing GPS [${vehiclePosition[0].toFixed(6)}, ${vehiclePosition[1].toFixed(6)}] against polygons...`);
  
  for (const polygon of MLK_APPROACH_POLYGONS) {
    console.log(`🔍 Testing against ${polygon.name}...`);
    
    // Log polygon bounds for debugging
    const lats = polygon.detectionZone.map(([lng, lat]) => lat);
    const lngs = polygon.detectionZone.map(([lng, lat]) => lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    
    console.log(`🔍 Polygon bounds: lat [${minLat.toFixed(6)} to ${maxLat.toFixed(6)}], lng [${minLng.toFixed(6)} to ${maxLng.toFixed(6)}]`);
    
    if (isPointInPolygon(vehiclePosition, polygon.detectionZone)) {
      console.log(`✅ Vehicle is inside ${polygon.name}!`);
      return polygon;
    } else {
      console.log(`❌ Vehicle is outside ${polygon.name}`);
    }
  }
  
  console.log('❌ Vehicle is not in any polygon');
  return null;
};