// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Fixed car position near the crosswalk (latitude, longitude)
export const CAR_POSITION: [number, number] = [35.039731078086675, -85.29195435765939];

// Detection radius in degrees (approximately 10 meters)
export const DETECTION_RADIUS = 0.0001;

// Export the polygon coordinates
export const CROSSWALK_POLYGON_COORDS: [number, number][] = [
  [-85.2920762718887, 35.03978728603656],
  [-85.29205284218322, 35.03978060114275],
  [-85.29207044005425, 35.03974560949982],
  [-85.29209557987005, 35.03975411727332],
  [-85.2920762718887, 35.03978728603656]  // Closing the polygon by repeating the first point
];

// Directly using the exact center point provided (longitude, latitude)
export const CROSSWALK_CENTER: [number, number] = [-85.29202970933544, 35.03975204972481];