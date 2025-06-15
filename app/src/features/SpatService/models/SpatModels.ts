// app/src/features/SpatService/models/SpatModels.ts

export interface SpatData {
  phaseStatusGroupGreens: number[];
  phaseStatusGroupReds: number[];
  phaseStatusGroupYellows: number[];
  timestamp: number;
  intersection: string;
}

export enum SignalState {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW', 
  RED = 'RED',
  UNKNOWN = 'UNKNOWN'
}

export interface LaneSignalStatus {
  laneId: number;
  signalGroups: number[];
  signalState: SignalState;
}

export interface ApproachSignalStatus {
  approachId: string;
  approachName: string;
  laneIds: number[];
  overallSignalState: SignalState;
  laneSignalStatuses: LaneSignalStatus[];
  timestamp: number;
}