// app/src/features/UserHeading/models/HeadingModels.ts

export interface HeadingData {
  magneticHeading: number;        // Magnetic heading in degrees (0-360)
  trueHeading?: number;           // True heading in degrees (0-360, if available)
  movementHeading?: number;       // Direction of travel based on GPS (0-360)
  accuracy: number;               // Heading accuracy in degrees
  timestamp: number;              // When heading was measured
}

export interface HeadingConfig {
  enableCompass: boolean;         // Whether to use device compass
  enableMovementTracking: boolean; // Whether to track movement direction
  smoothingFactor: number;        // Smoothing factor for heading changes (0-1)
  updateInterval: number;         // Update interval in milliseconds
}

export enum HeadingDirection {
  NORTH = 'North',
  NORTHEAST = 'Northeast', 
  EAST = 'East',
  SOUTHEAST = 'Southeast',
  SOUTH = 'South',
  SOUTHWEST = 'Southwest',
  WEST = 'West',
  NORTHWEST = 'Northwest'
}