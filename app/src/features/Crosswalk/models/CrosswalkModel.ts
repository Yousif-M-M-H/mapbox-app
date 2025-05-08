// app/src/features/Crosswalk/models/CrosswalkModel.ts

import type { Feature, Polygon } from 'geojson';
import { MLK_CENTRAL_CROSSWALK_COORDINATES } from '../constants/CrosswalkCoordinates';

/**
 * GeoJSON Feature<Polygon> for the MLK Central Crosswalk.
 * The explicit typing fixes the TS2345 errors in GeoUtils.ts.
 */
export const CROSSWALK_POLYGON: Feature<Polygon, { name: string; id: string }> = {
  type: 'Feature',                      // now a literal type
  properties: {
    name: 'MLK Central Crosswalk',
    id:   'mlk_central_crosswalk',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [MLK_CENTRAL_CROSSWALK_COORDINATES],
  },
};

/**
 * Simple interface for pedestrian (VRU) data.
 */
export interface Pedestrian {
  id:        number;
  location:  [number, number]; // [longitude, latitude]
  timestamp: string;           // ISO‐8601 date string
}
