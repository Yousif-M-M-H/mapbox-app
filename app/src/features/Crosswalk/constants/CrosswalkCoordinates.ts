// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Fixed car position near the crosswalk (latitude, longitude)
export const CAR_POSITION: [number, number] = [35.03976132931588, -85.29203348931138];

// Detection radius in degrees (approximately 10 meters)
export const DETECTION_RADIUS = 0.0001;

// UPDATED: Crosswalk polygons moved closer to the main intersection
// The intersection appears to be around: [-85.29210877725966, 35.039778261477665]
/*
export const CROSSWALK_POLYGONS: [number, number][][] = [
  // Crosswalk 1 - Moved closer to intersection center
  [
    [-85.29215, 35.03980],     // Northwest corner
    [-90.29205, 40.03977],     // Northeast corner  
    [-85.29206, 35.33975],     // Southeast corner
    [-85.29216, 35.13978],     // Southwest corner
    [-85.29215, 40.03980]      // Close polygon
  ],
  // Crosswalk 2 - Alternative position closer to intersection
  [
    [-85.29208, 35.03982],     // Northwest corner
    [-85.29198, 35.03979],     // Northeast corner
    [-85.29199, 35.03977],     // Southeast corner
    [-85.29209, 35.03980],     // Southwest corner
    [-85.29208, 35.03982]      // Close polygon
  ]
];
*/

// Main intersection coordinates from your DirectionGuide constants
const INTERSECTION_LNG = -85.29210877725966;
const INTERSECTION_LAT = 35.039778261477665;

export const CROSSWALK_POLYGONS: [number, number][][] = [
  // North crosswalk - 15 meters north of intersection
  generateCrosswalkNearIntersection(INTERSECTION_LNG, INTERSECTION_LAT, 15, 4),
  
  // South crosswalk - 15 meters south of intersection  
  generateCrosswalkNearIntersection(INTERSECTION_LNG, INTERSECTION_LAT, -15, 4),
  
  // East crosswalk - 15 meters east of intersection
  generateCrosswalkNearIntersection(INTERSECTION_LNG + 0.00015, INTERSECTION_LAT, 0, 4),
  
  // West crosswalk - 15 meters west of intersection
  generateCrosswalkNearIntersection(INTERSECTION_LNG - 0.00015, INTERSECTION_LAT, 0, 4)
];


// Keep backward compatibility
export const CROSSWALK_POLYGON_COORDS = CROSSWALK_POLYGONS[0];

// Calculate center for each crosswalk
export const CROSSWALK_CENTERS: [number, number][] = CROSSWALK_POLYGONS.map(polygon => {
  const lats = polygon.map(([lng, lat]) => lat);
  const lngs = polygon.map(([lng, lat]) => lng);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return [centerLng, centerLat];
});

// Main crosswalk center (using first crosswalk)
export const CROSSWALK_CENTER: [number, number] = CROSSWALK_CENTERS[0];

// HELPER FUNCTION: Generate crosswalk coordinates relative to intersection
export function generateCrosswalkNearIntersection(
  intersectionLng: number,
  intersectionLat: number,
  offsetMeters: number = 13,
  widthMeters: number = 20
): [number, number][] {
  // Convert meters to approximate coordinate degrees
  // 1 degree ≈ 111,000 meters, so:
  const metersToDegrees = 1 / 111000;
  const offset = offsetMeters * metersToDegrees;
  const width = widthMeters * metersToDegrees;
  
  return [
    [intersectionLng - width/2, intersectionLat + offset],    // NW
    [intersectionLng + width/2, intersectionLat + offset],    // NE
    [intersectionLng + width/2, intersectionLat + offset - width], // SE
    [intersectionLng - width/2, intersectionLat + offset - width], // SW
    [intersectionLng - width/2, intersectionLat + offset]     // Close polygon
  ];
}

// ALTERNATIVE: Use the helper function to generate crosswalks
// Uncomment this section and comment out CROSSWALK_POLYGONS above to use generated crosswalks


