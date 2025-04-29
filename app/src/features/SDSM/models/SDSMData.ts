// app/src/features/SDSM/models/SDSMData.ts
export interface SDSMVehicle {
  _id?: string; // May not be present in Redis data
  intersectionID: string;
  intersection: string;
  objectID: number;
  type: string;
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number]; // Will be [longitude, latitude] after transformation
  };
  heading: number;
  speed: number;
  size: {
    width: number;
    length: number;
  };
  // Add any other fields from Redis data
}

export interface SDSMResponse {
  success: boolean;
  count: number;
  data: SDSMVehicle[];
}