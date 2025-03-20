export interface RouteModel {
  coordinates: [number, number][];
  distance?: number; // in meters
  duration?: number; // in seconds
}

export interface LineStringFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  properties: object;
}

export const createRouteFeature = (coordinates: [number, number][]): LineStringFeature => {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    },
    properties: { profile: 'driving' }
  };
};