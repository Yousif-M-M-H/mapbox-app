// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Fixed car position near the crosswalk (latitude, longitude)
export const CAR_POSITION: [number, number] = [35.039731078086675, -85.29195435765939];

// Detection radius in degrees (approximately 10 meters)
export const DETECTION_RADIUS = 0.0001;

// Export the polygon coordinates
export const CROSSWALK_POLYGON_COORDS: [number, number][] = [
  [-85.29202787790969, 35.03977429811067],
  [-85.29201141934844, 35.03976939792585],
  [-85.29203386284122, 35.03973080896036],
  [-85.29204857579744, 35.039736525845356],
  [-85.29202787790969, 35.03977429811067]  // Closing the polygon by repeating the first point
];

// Directly using the exact center point provided (longitude, latitude)
export const CROSSWALK_CENTER: [number, number] = [-85.29202970933544, 35.03975204972481];