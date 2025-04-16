// src/core/services/SDSMService.ts
import { API_CONFIG } from '../api/config';

// Types to match the API response structure
export interface SDSMVehicle {
  _id: string;
  size: {
    width: number;
    length: number;
  };
  heading: number;
  intersection: string;
  intersectionID: string;
  location: {
    coordinates: [number, number]; // [longitude, latitude]
    type: string;
  };
  type: string;
  objectID: number;
  speed: number;
  timestamp: string;
}

export interface SDSMResponse {
  success: boolean;
  count: number;
  data: SDSMVehicle[];
}

export class SDSMService {
  /**
   * Get all SDSM data from the API
   * @param limit Maximum number of records to return
   */
  static async getAllSDSM(limit: number = 100): Promise<SDSMResponse> {
    try {
      console.log(`Fetching SDSM data from API endpoint: ${API_CONFIG.API_URL}/sdsm/all`);
      
      const url = `${API_CONFIG.API_URL}/sdsm/all?limit=${limit}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const result: SDSMResponse = await response.json();
      console.log(`API response received: ${result.count} SDSM data points`);
      
      return result;
    } catch (error) {
      console.error('Error fetching SDSM data:', error);
      return {
        success: false,
        count: 0,
        data: []
      };
    }
  }
}