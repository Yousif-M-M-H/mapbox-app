// app/src/features/Crosswalk/constants/CrosswalkCoordinates.ts

// Fixed car position near the crosswalk (latitude, longitude)
export const CAR_POSITION: [number, number] = [35.039763, -85.291879];

// Detection radius in degrees (approximately 10 meters)
export const DETECTION_RADIUS = 0.0001;

// Calculate the center point of the crosswalk from KML
const CROSSWALK_POLYGON_COORDS: [number, number][] = [
  [-85.29208247618223, 35.03970460251657],
  [-85.29204685139914, 35.03969250220254],
  [-85.29198391854935, 35.039812725442],
  [-85.29201539683289, 35.03983160316934],
  [-85.29208247618223, 35.03970460251657]
];

// Calculate center of the crosswalk (longitude, latitude)
const calculateCrosswalkCenter = (): [number, number] => {
  let lonSum = 0;
  let latSum = 0;
  const uniqueCoords = CROSSWALK_POLYGON_COORDS.slice(0, -1);
  
  for (const coord of uniqueCoords) {
    lonSum += coord[0];
    latSum += coord[1];
  }
  
  return [
    lonSum / uniqueCoords.length,
    latSum / uniqueCoords.length
  ];
};

// Crosswalk center (longitude, latitude)
export const CROSSWALK_CENTER = calculateCrosswalkCenter();