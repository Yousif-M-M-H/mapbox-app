// app/src/features/SpatService/services/SpatApiService.ts
// Focused solely on API communication

import { SpatData } from '../models/SpatModels';
import { SpatErrorHandler } from '../errorHandling/SpatErrorHandler';

export class SpatApiService {
  private static readonly SPAT_API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events';
  private static readonly REQUEST_TIMEOUT = 5000;
  
  /**
   * Fetch current SPaT data from API
   */
  public static async fetchSpatData(): Promise<SpatData> {
    try {
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(this.SPAT_API_URL, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw SpatErrorHandler.createApiError(response.status, response.statusText);
      }
      
      const rawData = await response.json();
      
      return rawData;
      
    } catch (error: unknown) {
      throw SpatErrorHandler.handleApiError(error);
    }
  }
  
  /**
   * Test API connectivity
   */
  public static async testConnection(): Promise<boolean> {
    try {
      await this.fetchSpatData();
      return true;
    } catch (error: unknown) {
      return false;
    }
  }
}