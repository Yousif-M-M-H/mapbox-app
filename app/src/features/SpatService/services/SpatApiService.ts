// app/src/features/SpatService/services/SpatApiService.ts
// Service responsible for SPaT API communication

import { SignalState } from '../models/SpatModels';
import { TESTING_CONFIG } from '../../../testingFeatures/TestingConfig';

export interface SpatApiResponse {
  phaseStatusGroupReds: number[];
  phaseStatusGroupYellows: number[];
  phaseStatusGroupGreens: number[];
  timestamp: number;
  [key: string]: any;
}

export class SpatApiService {
  private static API_ENDPOINT = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Georgia';
  private static readonly REQUEST_TIMEOUT = 8000; // 5 seconds

  /**
   * Set the API endpoint for specific intersection
   */
  static setApiEndpoint(intersection: 'georgia' | 'houston'): void {
    if (intersection === 'georgia') {
      this.API_ENDPOINT = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Georgia';
    } else if (intersection === 'houston') {
      this.API_ENDPOINT = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Houston';
    }
  }

  /**
   * Fetch current SPaT data from API
   */
  static async fetchSpatData(intersection?: 'georgia' | 'houston'): Promise<SpatApiResponse | null> {
    // Set API endpoint if intersection is specified
    if (intersection) {
      this.setApiEndpoint(intersection);
    }
    // Check if SDSM API is enabled (SPaT is part of same system)
    if (!TESTING_CONFIG.ENABLE_SDSM_API) {
      return null;
    }

    try {
      // Create a timeout promise for React Native compatibility
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT);
      });

      const fetchPromise = fetch(this.API_ENDPOINT, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        console.warn(`SPaT API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const spatData = await response.json();
      return spatData as SpatApiResponse;
    } catch (error) {
      console.warn('Failed to fetch SPaT data:', error);
      return null;
    }
  }

  /**
   * Get signal state for a specific signal group from SPaT data
   */
  static getSignalStateForGroup(spatData: SpatApiResponse, signalGroup: number): SignalState {
    if (!spatData) {
      return SignalState.UNKNOWN;
    }

    // Check if signal group is in GREEN phase
    if (spatData.phaseStatusGroupGreens && Array.isArray(spatData.phaseStatusGroupGreens)) {
      if (spatData.phaseStatusGroupGreens.includes(signalGroup)) {
        return SignalState.GREEN;
      }
    }

    // Check if signal group is in YELLOW phase
    if (spatData.phaseStatusGroupYellows && Array.isArray(spatData.phaseStatusGroupYellows)) {
      if (spatData.phaseStatusGroupYellows.includes(signalGroup)) {
        return SignalState.YELLOW;
      }
    }

    // Check if signal group is in RED phase
    if (spatData.phaseStatusGroupReds && Array.isArray(spatData.phaseStatusGroupReds)) {
      if (spatData.phaseStatusGroupReds.includes(signalGroup)) {
        return SignalState.RED;
      }
    }

    return SignalState.UNKNOWN;
  }

  /**
   * Check if SPaT data is valid and fresh
   */
  static isDataValid(spatData: SpatApiResponse | null, maxAgeMs: number = 5000): boolean {
    if (!spatData || !spatData.timestamp) {
      return false;
    }

    const dataAge = Date.now() - spatData.timestamp;
    return dataAge <= maxAgeMs;
  }
}