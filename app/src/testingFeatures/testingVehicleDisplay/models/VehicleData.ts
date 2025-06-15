// app/src/testingFeatures/testingVehicleDisplay/models/VehicleData.ts

export interface VehicleData {
  objectID: number;
  type: 'vehicle';
  timestamp: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lat, lng] from API
  };
  heading?: number;
  speed?: number;
  size?: {
    width: number | null;
    length: number | null;
  };
}

export interface SDSMVehicleResponse {
  intersectionID: string;
  intersection: string;
  timestamp: string;
  objects: VehicleData[];
}