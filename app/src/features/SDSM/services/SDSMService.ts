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
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: SDSMResponse = await response.json();
      console.log(`Received ${data.count} SDSM objects from API`);
      
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
  
  /**
   * Filter SDSM data to only include MLK_Central intersection
   * (This is redundant if the API already filters, but added as a safeguard)
   */
  static filterByIntersection(data: SDSMResponse, intersection: string = 'MLK_Central'): SDSMResponse {
    const filteredData = data.data.filter(item => item.intersection === intersection);
    return {
      success: data.success,
      count: filteredData.length,
      data: filteredData
    };
  }
}