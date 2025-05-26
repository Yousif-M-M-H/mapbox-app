// app/src/features/SDSM/models/SDSMData.ts

/**
 * Individual object in SDSM data (vehicle or VRU/pedestrian)
 */
export interface SDSMObject {
  objectID: number;
  type: 'vru' | 'vehicle';
  timestamp: string;
  location: {
    type: string; // Usually "Point"
    coordinates: [number, number]; // [latitude, longitude] format
  };
  heading?: number;
  speed?: number;
  size?: {
    width: number | null;
    length: number | null;
  };
}

/**
 * Complete SDSM API response structure based on your sample data:
 * {
 *   "intersectionID": "27481",
 *   "intersection": "MLK_Central", 
 *   "timestamp": "2025-05-21T00:03:09.388487",
 *   "objects": [...]
 * }
 */
export interface SDSMResponse {
  intersectionID: string;
  intersection: string; // Intersection name like "MLK_Central"
  timestamp: string;
  objects: SDSMObject[];
}

/**
 * Processed pedestrian data for easier use in components
 */
export interface PedestrianInfo {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
  timestamp: string;
  heading?: number;
  speed?: number;
  isInCrosswalk?: boolean;
  distanceFromVehicle?: number;
}

/**
 * Vehicle data extracted from SDSM
 */
export interface VehicleInfo {
  id: number;
  coordinates: [number, number]; // [latitude, longitude]
  timestamp: string;
  heading?: number;
  speed?: number;
  size?: {
    width: number | null;
    length: number | null;
  };
}