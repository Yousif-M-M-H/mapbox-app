// app/src/features/DirectionGuide/constants/ApproachPolygonConfig.ts

/**
 * Configuration for approach polygons and their associated lanes
 * Each polygon defines a detection zone ~50m back from intersection
 */

export interface ApproachPolygon {
    id: string;
    name: string;
    lanes: number[];           // Lane IDs associated with this approach
    signalGroups: number[];    // Signal groups for future SPaT integration
    detectionZone: [number, number][]; // Polygon coordinates [lng, lat]
  }
  
  /**
   * MLK Intersection Approach Polygons
   * Each polygon represents a ~50-meter detection zone for specific lanes
   */
  export const MLK_APPROACH_POLYGONS: ApproachPolygon[] = [
    {
      id: 'north_approach',
      name: 'North Approach (Lanes 1 & 2)', 
      lanes: [1, 2],
      signalGroups: [4, 3], // Based on connectsTo data
      detectionZone: [
        [-85.2920762718887, 35.03978728603656],
        [-85.29205284218322, 35.03978060114275], 
        [-85.29207044005425, 35.03974560949982],
        [-85.29209557987005, 35.03975411727332],
        [-85.2920762718887, 35.03978728603656]  // Close the polygon
      ]
    },
    
    // TODO: Add other approach polygons as needed
    // {
    //   id: 'south_approach',
    //   name: 'South Approach (Lanes 12 & 13)',
    //   lanes: [12, 13],
    //   signalGroups: [2, 52],
    //   detectionZone: [
    //     // Define polygon coordinates for south approach
    //   ]
    // },
    
    // {
    //   id: 'east_approach', 
    //   name: 'East Approach (Lanes 8 & 9)',
    //   lanes: [8, 9],
    //   signalGroups: [4, 3],
    //   detectionZone: [
    //     // Define polygon coordinates for east approach  
    //   ]
    // },
    
    // {
    //   id: 'west_approach',
    //   name: 'West Approach (Lanes 5 & 6)', 
    //   lanes: [5, 6],
    //   signalGroups: [6, 16],
    //   detectionZone: [
    //     // Define polygon coordinates for west approach
    //   ]
    // }
  ];
  
  /**
   * Get approach polygon by ID
   */
  export const getApproachPolygonById = (id: string): ApproachPolygon | undefined => {
    return MLK_APPROACH_POLYGONS.find(polygon => polygon.id === id);
  };
  
  /**
   * Get all approach polygon IDs
   */
  export const getAllApproachPolygonIds = (): string[] => {
    return MLK_APPROACH_POLYGONS.map(polygon => polygon.id);
  };