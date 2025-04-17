// app/src/features/SDSM/models/SDSMData.ts
export interface SDSMVehicle {
    _id: string;
    size: {
      width: number;
      length: number;
    };
    heading: number;
    intersection: string;
    intersectionID: string;
    location: {
      coordinates: [number, number]; // [longitude, latitude]
      type: string;
    };
    type: string;
    objectID: number;
    speed: number;
    timestamp: string;
  }
  
  export interface SDSMResponse {
    success: boolean;
    count: number;
    data: SDSMVehicle[];
  }