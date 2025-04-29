export interface LaneAttributes {
  directionalUse: number[];
  laneType: any; // Mixed type as per MongoDB schema
  sharedWidth: number[];
}

export interface LaneLocation {
  coordinates: [number, number][]; // Array of [longitude, latitude] pairs
  type: string; // Usually "LineString"
}

export interface Lane {
  _id: string;
  connectsTo: string[];
  laneId: number;
  laneAttributes: LaneAttributes;
  intersectionId: number;
  location: LaneLocation;
  intersectionName: string;
  maneuvers: string[];
  timestamp: string;
}

export interface LanesResponse {
  success: boolean;
  count: number;
  totalDocuments: number;
  totalPages: number;
  currentPage: number;
  data: Lane[];
}