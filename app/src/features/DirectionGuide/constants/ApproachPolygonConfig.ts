// app/src/features/DirectionGuide/constants/ApproachPolygonConfig.ts

export interface ApproachPolygon {
  id: string;
  name: string;
  lanes: number[];           
  signalGroups: number[];    
  detectionZone: [number, number][]; // [lng, lat] format (GeoJSON standard)
}

/**
 * MLK Intersection Approach Polygons
 * Using your original coordinates (which are correct)
 * Format: [longitude, latitude] (GeoJSON standard)
 */
export const MLK_APPROACH_POLYGONS: ApproachPolygon[] = [
  {
    id: 'north_approach',
    name: 'North Approach (Lanes 1 & 2)', 
    lanes: [1, 2],
    signalGroups: [4, 3],
    detectionZone: [
      [-85.29207614188559, 35.03979046838191],
      [-85.29135644775326, 35.03957372670499], 
      [-85.29137863764247, 35.03949903483698],
      [-85.29209422013183, 35.03974161963241],
      [-85.29207614188559, 35.03979046838191] // Close polygon
    ]
  }
];

export const getApproachPolygonById = (id: string): ApproachPolygon | undefined => {
  return MLK_APPROACH_POLYGONS.find(polygon => polygon.id === id);
};

export const getAllApproachPolygonIds = (): string[] => {
  return MLK_APPROACH_POLYGONS.map(polygon => polygon.id);
};