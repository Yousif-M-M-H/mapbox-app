// app/src/features/SpatService/services/SpatApiService.ts

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
  private static readonly GEORGIA_ENDPOINT = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Georgia';
  private static readonly HOUSTON_ENDPOINT = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Houston';
  private static readonly REQUEST_TIMEOUT = 5000; // 5 seconds
  
  // Current endpoint based on intersection
  private static currentEndpoint: string = SpatApiService.GEORGIA_ENDPOINT;
  private static currentIntersection: 'georgia' | 'houston' | null = null;

  /**
   * Get the API endpoint for a specific intersection
   */
  static getEndpointForIntersection(intersection: 'georgia' | 'houston'): string {
    if (intersection === 'georgia') {
      return this.GEORGIA_ENDPOINT;
    } else if (intersection === 'houston') {
      return this.HOUSTON_ENDPOINT;
    }
    return this.GEORGIA_ENDPOINT;
  }

  /**
   * Set the current intersection for API calls
   */
  static setCurrentIntersection(intersection: 'georgia' | 'houston' | null): void {
    this.currentIntersection = intersection;
    if (intersection) {
      this.currentEndpoint = this.getEndpointForIntersection(intersection);
      console.log(`🚦 SPaT API switched to ${intersection}: ${this.currentEndpoint}`);
    }
  }

  /**
   * Get current intersection
   */
  static getCurrentIntersection(): 'georgia' | 'houston' | null {
    return this.currentIntersection;
  }

  /**
   * Fetch current SPaT data from API
   */
  static async fetchSpatData(): Promise<SpatApiResponse | null> {
    // Check if SDSM API is enabled (SPaT is part of same system)
    if (!TESTING_CONFIG.ENABLE_SDSM_API) {
      return null;
    }

    // Only fetch if we have a valid intersection set
    if (!this.currentIntersection) {
      console.log('🚦 No intersection set - skipping SPaT fetch');
      return null;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT);
      });

      const fetchPromise = fetch(this.currentEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        console.log(`🚦 SPaT API returned ${response.status}`);
        return null;
      }

      const spatData = await response.json();
      return spatData as SpatApiResponse;
    } catch (error) {
      console.error('🚦 SPaT API error:', error);
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