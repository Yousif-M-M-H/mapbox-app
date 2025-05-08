// app/src/features/Crosswalk/utils/GeoUtils.ts

import { point } from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import polygonToLine from '@turf/polygon-to-line';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import distance from '@turf/distance';
import bearing from '@turf/bearing';
import { CROSSWALK_POLYGON } from '../models/CrosswalkModel';

/**
 * Check if a [lon, lat] point lies inside the crosswalk polygon.
 */
export const isPointInCrosswalk = (pointCoords: [number, number]): boolean => {
  const ptFeature = point(pointCoords);
  return booleanPointInPolygon(ptFeature, CROSSWALK_POLYGON);
};

/**
 * Determine whether a vehicle at `position` ([lon, lat]) with given `heading`
 * is approaching the crosswalk (within ±45° of the bearing to the crosswalk edge).
 */
export const isApproachingCrosswalk = (
  position: [number, number],
  heading: number
): boolean => {
  // Convert polygon → line for nearest‐point calculations
  const lineString = polygonToLine(CROSSWALK_POLYGON);
  const line = lineString.type === 'FeatureCollection'
    ? lineString.features[0]
    : lineString;

  const ptFeature   = point(position);
  const nearestPt   = nearestPointOnLine(line, ptFeature);
  const bearingToPt = bearing(ptFeature, nearestPt);

  // Normalize difference to [-180, +180]
  let diff = bearingToPt - heading;
  while (diff > 180)  diff -= 360;
  while (diff < -180) diff += 360;

  return Math.abs(diff) < 45;
};

/**
 * Compute the shortest distance (in meters) from a point ([lon, lat])
 * to the crosswalk perimeter.
 */
export const distanceToCrosswalk = (pointCoords: [number, number]): number => {
  const lineString = polygonToLine(CROSSWALK_POLYGON);
  const line = lineString.type === 'FeatureCollection'
    ? lineString.features[0]
    : lineString;

  const ptFeature = point(pointCoords);
  const nearestPt = nearestPointOnLine(line, ptFeature);

  return distance(ptFeature, nearestPt, { units: 'meters' });
};
