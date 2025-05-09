// app/src/features/Crosswalk/utils/GeoUtils.ts
import { INTERSECTION_CENTER, DETECTION_RADIUS } from '../constants/CrosswalkCoordinates';

/**
 * Check if a [lon, lat] point lies inside the circular detection zone.
 */
export const isPointInCrosswalk = (pointCoords: [number, number]): boolean => {
  // Calculate distance from point to intersection center in meters
  const dist = distanceToCrosswalkCenter(pointCoords);
  
  // Check if distance is less than the detection radius
  return dist <= DETECTION_RADIUS;
};

/**
 * Calculate the distance from a point to the intersection center in meters.
 */
export const distanceToCrosswalkCenter = (pointCoords: [number, number]): number => {
  return calculateDistance(
    INTERSECTION_CENTER[0], // latitude of center
    INTERSECTION_CENTER[1], // longitude of center
    pointCoords[1],         // latitude of point (swapped since pointCoords is [lon, lat])
    pointCoords[0]          // longitude of point
  );
};

/**
 * Calculate distance between two points using the Haversine formula.
 */
export const calculateDistance = (
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
};

/**
 * Convert degrees to radians.
 */
const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};