import { CAR_POSITION } from '../../Crosswalk/constants/CrosswalkCoordinates';

/**
 * Constants for the Direction Guide feature testing
 */

// MLK Intersection details
export const MLK_INTERSECTION_ID = 27481;
export const MLK_INTERSECTION_NAME = "MLK - Central Ave.";

// MLK Intersection coordinates from the API data
// The coordinates are flipped from the API as [lat, lng] instead of [lng, lat]
export const MLK_INTERSECTION_POSITION: [number, number] = [35.0396973, -85.2920456];

// Re-export CAR_POSITION for convenience
export { CAR_POSITION };

// API endpoint for map data
export const MAP_DATA_API_URL = 'http://10.199.1.11:9095/latest/map_events';