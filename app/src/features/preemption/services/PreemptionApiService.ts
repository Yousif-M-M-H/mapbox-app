import { API_CONFIG } from '../../../core/api/config';
import type {
  PreemptionPayloadPreview,
  PreemptionRequestContext,
  PreemptionRequestType,
  SignalRequestMessage,
  VehicleRole,
} from '../models/PreemptionModels';

export class PreemptionApiService {
  private static sequenceNumber = 0;
  private static requestId = 0;

  // Random session-based vehicle ID (generated once per app session)
  private static readonly ENTITY_ID = Math.floor(Math.random() * 0xffff);

  private static readonly DEFAULT_ROLE: VehicleRole = 'emergency';

  static buildRequestEndpoint(): string {
    return `${API_CONFIG.DASHBOARD_API_URL}/api/preemption`;
  }

  static buildRequestPreview(
    context: PreemptionRequestContext,
  ): PreemptionPayloadPreview {
    const endpoint = this.buildRequestEndpoint();
    const payload = this.buildSignalRequestMessage(context);

    return {
      endpoint,
      payload,
      createdAtIso: new Date().toISOString(),
    };
  }

  private static buildSignalRequestMessage(
    context: PreemptionRequestContext,
  ): SignalRequestMessage {
    const requestType: PreemptionRequestType =
      context.options?.requestType ?? 'priorityRequest';
    const requestId = context.options?.requestId ?? this.nextRequestId();
    const sequenceNumber =
      context.options?.sequenceNumber ?? this.nextSequenceNumber();
    const vehicleRole = context.options?.vehicleRole ?? this.DEFAULT_ROLE;

    const laneId =
      Array.isArray(context.zone.laneIds) && context.zone.laneIds.length > 0
        ? context.zone.laneIds[0]
        : 0;

    const now = new Date();
    const timeStamp = this.computeMinuteOfYear(now);
    const second = now.getUTCSeconds() * 1000 + now.getUTCMilliseconds();

    // Convert lat/lng to J2735 format (degrees × 10^7)
    const [lat, lng] = context.position;
    const latJ2735 = Math.round(lat * 1e7);
    const longJ2735 = Math.round(lng * 1e7);

    return {
      timeStamp,
      second,
      sequenceNumber,
      requests: [
        {
          request: {
            id: { id: context.intersectionNumber },
            requestID: requestId,
            requestType,
            inBoundLane: { lane: laneId },
          },
        },
      ],
      requestor: {
        id: { entityID: this.ENTITY_ID },
        type: { role: vehicleRole },
        position: { lat: latJ2735, long: longJ2735 },
      },
    };
  }

  private static computeMinuteOfYear(now: Date): number {
    const startOfYearUtc = Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0);
    const diffMs = now.getTime() - startOfYearUtc;
    return Math.floor(diffMs / 60000);
  }

  private static nextSequenceNumber(): number {
    const current = this.sequenceNumber;
    this.sequenceNumber = (this.sequenceNumber + 1) % 128; // 0-127
    return current;
  }

  private static nextRequestId(): number {
    const current = this.requestId;
    this.requestId = (this.requestId + 1) % 256; // 0-255
    return current;
  }
}
