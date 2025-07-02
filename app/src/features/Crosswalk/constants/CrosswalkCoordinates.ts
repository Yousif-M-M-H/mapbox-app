// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Fixed car position near the crosswalk (latitude, longitude)
export const CAR_POSITION: [number, number] = [35.03976132931588, -85.29203348931138];

// Detection radius in degrees (approximately 10 meters)
export const DETECTION_RADIUS = 0.0001;

// Export the polygon coordinates
export const CROSSWALK_POLYGON_COORDS: [number, number][] = [
  [-85.29209037893902, 35.03978691067064],
  [-85.29203293546509, 35.03976630063465],
  [-85.29204561249016, 35.039744276336506],
  [-85.2921106519217, 35.039765715061606],
  [-85.29209037893902, 35.03978691067064]  
];

// Directly using the exact center point provided (longitude, latitude)
export const CROSSWALK_CENTER: [number, number] = [-85.29202970933544, 35.03975204972481];