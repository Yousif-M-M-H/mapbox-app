// app/src/features/SDSM/models/SDSMData.ts
export interface SDSMObject {
  objectID: number;
  type: 'vru' | 'vehicle';
  timestamp: string;
  location: {
    type: string;
    coordinates: [number, number]; // [latitude, longitude]
  };
  heading?: number;
  speed?: number;
  size?: {
    width: number;
    length: number;
  };
}

export interface SDSMResponse {
  success: boolean;
  count: number;
  data: SDSMObject[];
}