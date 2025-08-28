// // app/src/features/DirectionGuide/utils/PolygonDetectionUtils.ts
// import { ApproachPolygon, MLK_APPROACH_POLYGONS, validateApproachPolygon } from '../constants/ApproachPolygonConfig';

// /**
//  * Point-in-polygon detection using ray casting algorithm
//  * 
//  * @param point [lat, lng] - GPS coordinates in [latitude, longitude] format
//  * @param polygon [lng, lat][] - Polygon coordinates in [longitude, latitude] format (GeoJSON standard)
//  */
// export const isPointInPolygon = (
//   point: [number, number], 
//   polygon: [number, number][]
// ): boolean => {
//   const [pointLat, pointLng] = point; // GPS: [lat, lng]
//   let inside = false;
  
//   // Polygon coordinates are in [lng, lat] format, so we need to swap them for comparison
//   const vertices = polygon.map(([lng, lat]) => [lat, lng]); // Convert to [lat, lng] for consistency
  
//   for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
//     const [latI, lngI] = vertices[i];
//     const [latJ, lngJ] = vertices[j];
    
//     if (((latI > pointLat) !== (latJ > pointLat)) && 
//         (pointLng < (lngJ - lngI) * (pointLat - latI) / (latJ - latI) + lngI)) {
//       inside = !inside;
//     }
//   }
  
//   return inside;
// };

// /**
//  * Enhanced approach polygon detection with detailed logging
//  * 
//  * @param vehiclePosition [lat, lng] - GPS coordinates in [latitude, longitude] format
//  */
// export const detectApproachPolygon = (
//   vehiclePosition: [number, number]
// ): ApproachPolygon | null => {
  
//   // Validate input
//   if (!vehiclePosition || vehiclePosition.length !== 2 || 
//       vehiclePosition[0] === 0 || vehiclePosition[1] === 0) {
//     return null;
//   }
  
//   for (const polygon of MLK_APPROACH_POLYGONS) {
//     // Validate polygon configuration
//     if (!validateApproachPolygon(polygon)) {
//       continue;
//     }
    
    
//     // Log polygon bounds for debugging
//     const bounds = getPolygonBounds(polygon.detectionZone);
    
//     if (isPointInPolygon(vehiclePosition, polygon.detectionZone)) {
//       return polygon;
//     } else {
//     }
//   }
  
//   return null;
// };

// /**
//  * Get bounding box of a polygon for debugging
//  */
// export const getPolygonBounds = (polygon: [number, number][]) => {
//   const lats = polygon.map(([lng, lat]) => lat);
//   const lngs = polygon.map(([lng, lat]) => lng);
  
//   return {
//     minLat: Math.min(...lats),
//     maxLat: Math.max(...lats),
//     minLng: Math.min(...lngs),
//     maxLng: Math.max(...lngs)
//   };
// };

// /**
//  * Check if vehicle is within any approach polygon (quick check)
//  */
// export const isVehicleInAnyApproach = (vehiclePosition: [number, number]): boolean => {
//   return detectApproachPolygon(vehiclePosition) !== null;
// };

// /**
//  * Get all approaches that contain the vehicle position
//  * (In case of overlapping polygons)
//  */
// export const detectAllApproachPolygons = (
//   vehiclePosition: [number, number]
// ): ApproachPolygon[] => {
//   const matchingPolygons: ApproachPolygon[] = [];
  
//   for (const polygon of MLK_APPROACH_POLYGONS) {
//     if (validateApproachPolygon(polygon) && 
//         isPointInPolygon(vehiclePosition, polygon.detectionZone)) {
//       matchingPolygons.push(polygon);
//     }
//   }
  
//   return matchingPolygons;
// };

// /**
//  * Distance from vehicle to polygon center (for prioritization)
//  */
// export const getDistanceToPolygonCenter = (
//   vehiclePosition: [number, number],
//   polygon: ApproachPolygon
// ): number => {
//   const bounds = getPolygonBounds(polygon.detectionZone);
//   const centerLat = (bounds.minLat + bounds.maxLat) / 2;
//   const centerLng = (bounds.minLng + bounds.maxLng) / 2;
  
//   const latDiff = vehiclePosition[0] - centerLat;
//   const lngDiff = vehiclePosition[1] - centerLng;
  
//   return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
// };