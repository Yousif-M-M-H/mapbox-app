// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Fixed car position near the crosswalk (latitude, longitude)
export const CAR_POSITION: [number, number] = [35.03976132931588, -85.29203348931138];

// Detection radius in degrees (approximately 10 meters)
export const DETECTION_RADIUS = 0.0001;

// Updated: Multiple crosswalk polygons
export const CROSSWALK_POLYGONS: [number, number][][] = [
  // Original MLK crosswalk
  [
    [-85.29209037893902, 35.03978691067064],
    [-85.29203293546509, 35.03976630063465],
    [-85.29204561249016, 35.039744276336506],
    [-85.2921106519217, 35.039765715061606],
    [-85.29209037893902, 35.03978691067064]  
  ],
  // New crosswalk polygon
  [
    [-85.30826640697222, 35.045778584831695],
    [-85.30817066333954, 35.04574448378297],
    [-85.30818986879696, 35.04571391053568],
    [-85.30827095849703, 35.045747541121244],
    [-85.30826640697222, 35.045778584831695]
  ]
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

// Directly using the exact center point provided (longitude, latitude)
export const CROSSWALK_CENTER: [number, number] = CROSSWALK_CENTERS[0];