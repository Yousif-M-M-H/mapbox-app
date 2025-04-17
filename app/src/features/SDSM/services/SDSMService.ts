// app/src/features/SDSM/services/SDSMService.ts
import { SDSMResponse } from '../models/SDSMData';
import { API_CONFIG } from '../../../core/api/config';

export class SDSMService {
  /**
   * Fetch SDSM data from the API for MLK_Central intersection
   * @param limit Optional parameter to limit the number of records returned
   * @returns Promise with SDSM data
   */
  static async fetchSDSMData(limit: number = 100): Promise<SDSMResponse> {
    try {
      console.log('Fetching SDSM data from API...');
      
      const url = `${API_CONFIG.API_URL}/sdsm/all?limit=${limit}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: SDSMResponse = await response.json();
      console.log(`Received ${data.count} SDSM objects from API`);
      
      // Log a sample vehicle if available
      if (data.data && data.data.length > 0) {
        console.log('Sample vehicle:', JSON.stringify(data.data[0], null, 2));
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

