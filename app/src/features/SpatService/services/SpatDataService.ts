// app/src/features/SpatService/services/SpatDataService.ts

import { SpatData } from '../models/SpatModels';

export class SpatDataService {
  private static readonly SPAT_API_URL = 'http://10.199.1.11:9095/latest/mlk_spat_events';
  
  /**
   * Fetch current SPaT data from endpoint
   */
  public static async fetchSpatData(): Promise<SpatData> {
    try {
      const response = await fetch(this.SPAT_API_URL, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error(`SPaT API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        phaseStatusGroupGreens: data.phaseStatusGroupGreens || [],
        phaseStatusGroupReds: data.phaseStatusGroupReds || [],
        phaseStatusGroupYellows: data.phaseStatusGroupYellows || [],
        timestamp: data.timestamp || Date.now(),
        intersection: data.intersection || 'Unknown'
      };
      
    } catch (error) {
      console.error('SPaT fetch failed:', error);
      throw error;
    }
  }
}