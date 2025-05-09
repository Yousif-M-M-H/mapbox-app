// app/src/features/Crosswalk/models/CrosswalkModel.ts
import type { Feature, Polygon, GeoJsonProperties } from 'geojson';
import { INTERSECTION_CENTER_LNGLAT, DETECTION_RADIUS } from '../constants/CrosswalkCoordinates';
import * as turf from '@turf/turf';

// Create a proper GeoJSON circle using turf.js
const circlePolygon = turf.circle(
  INTERSECTION_CENTER_LNGLAT, 
  DETECTION_RADIUS / 1000, // Convert meters to kilometers for turf
  { steps: 64, units: 'kilometers' }
);

export const CROSSWALK_CIRCLE: Feature<Polygon, GeoJsonProperties> = circlePolygon;

/**
 * Simple interface for pedestrian (VRU) data.
 */
export interface Pedestrian {
  id: number;
  location: [number, number]; // [longitude, latitude]
  timestamp: string;          // ISO‐8601 date string
}


