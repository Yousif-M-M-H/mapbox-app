import type { SpatZone } from '../../SpatService/services/SpatZoneService';

export type PreemptionRequestType = 'priorityRequest' | 'priorityCancellation';

export interface PreemptionZoneConfigApiResponse {
  intersection_id: number;
  spat_zone_id: number;
  updated_at?: string;
  zone_name?: string;
  lane_ids?: number[];
  signal_group?: number;
}

export interface PreemptionZoneConfig {
  intersectionId: number;
  intersectionNumber: number;
  spatZoneId: string;
  zoneName?: string;
  laneIds: number[];
  signalGroup: number | null;
  updatedAt?: string;
}

export interface PreemptionZoneContext {
  zoneId: string;
  zoneName: string;
  intersectionDbId: number;
  intersectionNumber: number;
  laneIds: number[];
  signalGroup: number;
}

export type VehicleRole = 'emergency' | 'transit' | 'truck';

export interface PreemptionRequestOptions {
  requestType?: PreemptionRequestType;
  requestId?: number;
  sequenceNumber?: number;
  vehicleRole?: VehicleRole;
}

export interface PreemptionRequestContext {
  intersectionNumber: number;
  zone: SpatZone;
  position: [number, number]; // [lat, lng]
  options?: PreemptionRequestOptions;
}

export interface PreemptionPayloadPreview {
  endpoint: string;
  payload: SignalRequestMessage;
  createdAtIso: string;
}

// SAE J2735 SignalRequestMessage (SRM) payload
export interface SignalRequestMessage {
  timeStamp: number;
  second: number;
  sequenceNumber: number;
  requests: SignalRequestPackage[];
  requestor: RequestorDescription;
}

export interface SignalRequestPackage {
  request: SignalRequest;
}

export interface SignalRequest {
  id: { id: number };
  requestID: number;
  requestType: PreemptionRequestType;
  inBoundLane: { lane: number };
}

export interface RequestorDescription {
  id: { entityID: number };
  type: { role: VehicleRole };
  position: { lat: number; long: number };
}
