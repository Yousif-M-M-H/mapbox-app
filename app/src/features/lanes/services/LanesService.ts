import { LanesResponse } from '../models/Lane';
import { API_CONFIG } from '../../../core/api/config';

export class LanesService {
  /**
   * Fetch lane data from the API
   * @param limit Optional parameter to limit the number of records returned
   * @returns Promise with lane data
   */
  static async fetchLanesData(limit: number = 100): Promise<LanesResponse> {
    try {
      console.log('Fetching map lane data from API...');
      
      const url = `${API_CONFIG.API_URL}/maps/all?limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data: LanesResponse = await response.json();
      
      // For debugging, log the first lane's coordinates if available
      if (data.data && data.data.length > 0 && data.data[0].location) {
        console.log('First lane coordinates:', JSON.stringify(data.data[0].location.coordinates));
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching lane data:', error);
      // Return empty data structure on error
      return {
        success: false,
        count: 0,
        totalDocuments: 0,
        totalPages: 0,
        currentPage: 0,
        data: []
      };
    }
  }
}