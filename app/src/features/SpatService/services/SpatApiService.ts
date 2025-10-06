// app/src/features/SpatService/services/SpatApiService.ts

import { SignalState } from '../models/SpatModels';

export interface SpatApiResponse {
  phaseStatusGroupReds: number[];
  phaseStatusGroupYellows: number[];
  phaseStatusGroupGreens: number[];
  timestamp: number;
  [key: string]: any;
}

export class SpatApiService {
  private static readonly ENDPOINTS = {
    georgia: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Georgia',
    houston: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Houston'
  };
  private static readonly TIMEOUT = 3000;

  static async fetchSpatData(intersection: 'georgia' | 'houston'): Promise<SpatApiResponse | null> {
    const url = this.ENDPOINTS[intersection];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  static getSignalStateForGroup(spatData: SpatApiResponse, signalGroup: number): SignalState {
    if (!spatData) return SignalState.UNKNOWN;

    if (spatData.phaseStatusGroupGreens?.includes(signalGroup)) {
      return SignalState.GREEN;
    }

    if (spatData.phaseStatusGroupYellows?.includes(signalGroup)) {
      return SignalState.YELLOW;
    }

    if (spatData.phaseStatusGroupReds?.includes(signalGroup)) {
      return SignalState.RED;
    }

    return SignalState.UNKNOWN;
  }
}