import { LanesResponse, Lane } from '../models/Lane';
import { API_CONFIG } from '../../../core/api/config';

export class LanesService {
  static async fetchLanesData(intersectionId: number = 27481): Promise<LanesResponse> {
    try {
      console.log('Fetching map lane data from Redis...');
      
      // Build the URL with filter for MLK Central
      let url = `${API_CONFIG.REDIS_MAP_ENDPOINT}?intersectionId=${intersectionId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse the response data
      const rawData = await response.json();
      
      // Handle different response formats
      let lanesArray: any[] = [];
      
      if (Array.isArray(rawData)) {
        lanesArray = rawData;
      } else if (rawData.data && Array.isArray(rawData.data)) {
        lanesArray = rawData.data;
      } else if (rawData.location) {
        // Single lane object
        lanesArray = [rawData];
      } else {
        // Look for any array property
        for (const key of Object.keys(rawData)) {
          if (Array.isArray(rawData[key])) {
            lanesArray = rawData[key];
            break;
          }
        }
      }
      
      // Simply use the data as-is without any coordinate transformation
      // The coordinates are already in the correct format
      
      return {
        success: true,
        count: lanesArray.length,
        totalDocuments: lanesArray.length,
        totalPages: 1,
        currentPage: 1,
        data: lanesArray as Lane[]
      };
    } catch (error) {
      console.error('Error fetching lane data from Redis:', error);
      
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