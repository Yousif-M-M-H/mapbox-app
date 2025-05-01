// app/src/features/lanes/models/Lane.ts
export interface LaneAttributes {
  directionalUse: number[];
  laneType: any; // Mixed type as per Redis schema
  sharedWith: number[]; // Changed from sharedWidth to match Redis
}

export interface LaneLocation {
  coordinates: [number, number][]; // Array of [longitude, latitude] pairs
  type: string; // Usually "LineString"
}

export interface Lane {
  _id?: string; // Make optional since Redis may not have it
  connectsTo: any[];
  laneId: number;
  laneAttributes: LaneAttributes;
  intersectionId: number;
  location: LaneLocation;
  intersectionName: string;
  maneuvers: any[];
  timestamp: string;
}

export interface LanesResponse {
  success: boolean;
  count: number;
  totalDocuments: number;
  totalPages: number;
  currentPage: number;
  data: Lane[];
  error?: any;
}