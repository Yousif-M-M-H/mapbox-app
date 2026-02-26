import { API_CONFIG } from '../../../core/api/config';
import type {
  PreemptionZoneConfig,
  PreemptionZoneConfigApiResponse,
} from '../models/PreemptionModels';

export class PreemptionConfigService {
  static async fetchZoneConfigByIntersectionNumber(
    intersectionNumber: number,
  ): Promise<PreemptionZoneConfig | null> {
    const endpoint =
      `${API_CONFIG.DASHBOARD_API_URL}/api/preemption-zone-config?intersection_number=${intersectionNumber}`;

    const response = await fetch(endpoint, { method: 'GET' });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to load preemption config (${response.status})`);
    }

    const data = (await response.json()) as PreemptionZoneConfigApiResponse | null;
    if (!data || data.spat_zone_id == null || data.intersection_id == null) {
      return null;
    }

    return {
      intersectionId: Number(data.intersection_id),
      intersectionNumber,
      spatZoneId: String(data.spat_zone_id),
      zoneName: data.zone_name,
      laneIds: Array.isArray(data.lane_ids) ? data.lane_ids : [],
      signalGroup:
        typeof data.signal_group === 'number' ? data.signal_group : null,
      updatedAt: data.updated_at,
    };
  }
}
