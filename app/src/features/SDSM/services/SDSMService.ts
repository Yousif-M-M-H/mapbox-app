// app/src/features/SDSM/services/SDSMService.ts
import { SDSMResponse } from '../models/SDSMData';
import { API_CONFIG } from '../../../core/api/config';

export class SDSMService {
  /**
   * Fetch SDSM data from the API
   * @param limit Optional parameter to limit the number of records returned
   * @returns Promise with SDSM data
   */
  static async fetchSDSMData(limit: number = 100): Promise<SDSMResponse> {
    try {
      console.log('Fetching SDSM data from API...');
      
      const url = `${API_CONFIG.API_URL}/sdsm/all?limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: SDSMResponse = await response.json();
      
      // For debugging, log the first vehicle's coordinates if available
      if (data.data && data.data.length > 0 && data.data[0].location) {
        console.log('First vehicle coordinates:', JSON.stringify(data.data[0].location.coordinates));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching SDSM data:', error);
      // Return empty data structure on error
      return {
        success: false,
        count: 0,
        data: []
      };
    }
  }
}