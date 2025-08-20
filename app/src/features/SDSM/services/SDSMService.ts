// app/src/features/SDSM/services/SDSMService.ts
import { SDSMResponse, SDSMObject, PedestrianInfo, VehicleInfo } from '../models/SDSMData';

export class SDSMService {
  private static readonly API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events';
  private static readonly REQUEST_TIMEOUT = 1000;

  /**
   * Fetch SDSM data from SPaT endpoint (vehicles and other objects)
   * @returns Promise with SDSM data including vehicles and pedestrians (VRUs)
   */
  static async fetchSDSMData(): Promise<SDSMResponse | null> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        return null;
      }
      
      const rawData: SDSMResponse = await response.json();
      
      // Check refPos before processing
      if (!this.hasValidRefPos(rawData)) {
        return null;
      }
      
      if (this.isValidSDSMResponse(rawData)) {
        return rawData;
      } else {
        return null;
      }
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if message has required refPos values
   */
  private static hasValidRefPos(data: any): boolean {
    return data?.refPos?.lat === 35.0457770 && data?.refPos?.long === -85.3082840;
  }
  
  /**
   * Validate that the API response has the expected structure
   */
  private static isValidSDSMResponse(data: any): data is SDSMResponse {
    return (
      data &&
      typeof data === 'object' &&
      (typeof data.intersectionID === 'string' || typeof data.intersectionID === 'number') &&
      typeof data.intersection === 'string' &&
      typeof data.timestamp === 'string' &&
      Array.isArray(data.objects)
    );
  }
  
  /**
   * Filter SDSM data to get only pedestrians (VRUs)
   */
  static filterPedestrians(sdsmData: SDSMResponse): SDSMObject[] {
    if (!sdsmData?.objects) {
      return [];
    }
    
    return sdsmData.objects.filter(obj => obj.type === 'vru');
  }
  
  /**
   * Filter SDSM data to get only vehicles
   */
  static filterVehicles(sdsmData: SDSMResponse): SDSMObject[] {
    if (!sdsmData?.objects) {
      return [];
    }
    
    return sdsmData.objects.filter(obj => obj.type === 'vehicle');
  }
  
  /**
   * Convert SDSM pedestrian objects to simplified pedestrian info
   */
  static getPedestrianInfo(sdsmData: SDSMResponse): PedestrianInfo[] {
    const pedestrians = this.filterPedestrians(sdsmData);
    
    return pedestrians.map(ped => ({
      id: ped.objectID,
      coordinates: ped.location.coordinates,
      timestamp: ped.timestamp,
      heading: ped.heading,
      speed: ped.speed
    }));
  }
  
  /**
   * Convert SDSM vehicle objects to simplified vehicle info
   */
  static getVehicleInfo(sdsmData: SDSMResponse): VehicleInfo[] {
    const vehicles = this.filterVehicles(sdsmData);
    
    return vehicles.map(vehicle => ({
      id: vehicle.objectID,
      coordinates: vehicle.location.coordinates,
      timestamp: vehicle.timestamp,
      heading: vehicle.heading,
      speed: vehicle.speed,
      size: vehicle.size
    }));
  }
  
  /**
   * Get summary statistics from SDSM data
   */
  static getDataSummary(sdsmData: SDSMResponse): {
    totalObjects: number;
    vehicleCount: number;
    pedestrianCount: number;
    intersectionName: string;
    lastUpdate: string;
  } {
    if (!sdsmData?.objects) {
      return {
        totalObjects: 0,
        vehicleCount: 0,
        pedestrianCount: 0,
        intersectionName: 'Unknown',
        lastUpdate: 'Never'
      };
    }
    
    const vehicles = this.filterVehicles(sdsmData);
    const pedestrians = this.filterPedestrians(sdsmData);
    
    return {
      totalObjects: sdsmData.objects.length,
      vehicleCount: vehicles.length,
      pedestrianCount: pedestrians.length,
      intersectionName: sdsmData.intersection,
      lastUpdate: sdsmData.timestamp
    };
  }
  
  /**
   * Test the SDSM API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const data = await this.fetchSDSMData();
      return data !== null;
    } catch (error) {
      return false;
    }
  }
}