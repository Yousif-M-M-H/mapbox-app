// app/src/features/DirectionGuide/constants/TestConstants.ts
import { CAR_POSITION } from '../../Crosswalk/constants/CrosswalkCoordinates';

/**
 * Constants for the Direction Guide feature
 */

// MLK Intersection details
export const MLK_INTERSECTION_ID = 27482;
export const MLK_INTERSECTION_NAME = "MLK - Central Ave";

// MLK Intersection center (for reference if needed)
export const MLK_INTERSECTION_CENTER: [number, number] = [35.039778261477665, -85.29210877725966];

// Re-export CAR_POSITION for convenience
export { CAR_POSITION };

// API endpoint for map data
export const MAP_DATA_API_URL = 'http://10.199.1.11:9095/latest/map_events';