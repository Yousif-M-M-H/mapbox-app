// app/src/features/DirectionGuide/constants/ApproachPolygonConfig.ts

export interface ApproachPolygon {
  id: string;
  name: string;
  lanes: number[];           
  signalGroups: number[];    
  detectionZone: [number, number][]; // [lng, lat] format (GeoJSON standard)
}

/**
 * MLK Intersection Approach Polygons - Now supports multiple approach zones
 * Format: [longitude, latitude] (GeoJSON standard)
 */
export const MLK_APPROACH_POLYGONS: ApproachPolygon[] = [
  {
    id: 'north_approach_lanes_1_2',
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
  },
  {
    id: 'north_approach_lanes_3_4',
    name: 'North Approach (Lanes 3 & 4)',
    lanes: [3, 4], 
    signalGroups: [], // No signal groups for lanes 3&4 per API data
    detectionZone: [
      [-85.29212330949959, 35.03981277960237],
      [-85.2917837875162, 35.040447295308056],
      [-85.291706152262, 35.040440210966565],
      [-85.29204083813852, 35.039802852275],
      [-85.29212330949959, 35.03981277960237] // Close polygon
    ]
  },
  {
    id: 'north_approach_lanes_5_6',
    name: 'North Approach (Lanes 5 & 6)',
    lanes: [5, 6],
    signalGroups: [6, 16], // Lane 5 uses signal group 6, Lane 6 uses signal group 16
    detectionZone: [
[-85.29219397693882, 35.03974688325445],
[-85.29274839711309, 35.03996528174804],
[-85.29270839384937, 35.04004706944633],
[-85.29213258657494, 35.03982659600631],
[-85.29219397693882, 35.03974688325445]
    ]
  },
  {
    id: 'north_approach_lanes_7_8',
    name: 'North Approach (Lanes 7 & 8)',
    lanes: [7, 8],
    signalGroups: [4], // Lane 7 has no signals, Lane 8 uses signal group 4
    detectionZone: [
      [-85.29215442186617, 35.039761886022035],
      [-85.2922661543919, 35.03955885633633],
      [-85.29220362584516, 35.03953876143373],
      [-85.29208884445653, 35.03974101825685],
      [-85.29215442186617, 35.039761886022035] // Close polygon
    ]
  }
];

/**
 * Configuration-driven approach management
 */
export const APPROACH_CONFIG = {
  // All available approaches at MLK intersection
  ALL_APPROACHES: MLK_APPROACH_POLYGONS,
  
  // Quick access by approach type
  NORTH_APPROACHES: MLK_APPROACH_POLYGONS.filter(p => p.id.includes('north')),
  
  // Lane groupings for easier management
  LANE_GROUPS: {
    'lanes_1_2': [1, 2],
    'lanes_3_4': [3, 4],
    'lanes_5_6': [5, 6],
    'lanes_7_8': [7, 8]
  }
};

/**
 * Enhanced utility functions
 */
export const getApproachPolygonById = (id: string): ApproachPolygon | undefined => {
  return MLK_APPROACH_POLYGONS.find(polygon => polygon.id === id);
};

export const getApproachPolygonsByLanes = (lanes: number[]): ApproachPolygon[] => {
  return MLK_APPROACH_POLYGONS.filter(polygon => 
    lanes.some(lane => polygon.lanes.includes(lane))
  );
};

export const getAllApproachPolygonIds = (): string[] => {
  return MLK_APPROACH_POLYGONS.map(polygon => polygon.id);
};

/**
 * Get approach polygons that have signal groups (for SPaT integration)
 */
export const getSignalGroupApproaches = (): ApproachPolygon[] => {
  return MLK_APPROACH_POLYGONS.filter(polygon => polygon.signalGroups.length > 0);
};

/**
 * Validation helper
 */
export const validateApproachPolygon = (polygon: ApproachPolygon): boolean => {
  return (
    polygon.id.length > 0 && 
    polygon.name.length > 0 && 
    polygon.lanes.length > 0 &&
    polygon.detectionZone.length >= 3 // Minimum for a polygon
  );
};