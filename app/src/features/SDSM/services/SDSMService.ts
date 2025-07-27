// app/src/features/SDSM/services/SDSMService.ts (Updated for SPaT endpoint)
import { SDSMResponse, SDSMObject, PedestrianInfo, VehicleInfo } from '../models/SDSMData';

export class SDSMService {
  // UPDATED: Using the SPaT endpoint as requested
  private static readonly API_URL = 'http://10.199.1.11:9095/latest/mlk_spat_events';
  private static readonly REQUEST_TIMEOUT = 1000; // Reduced for 10Hz updates

  /**
   * Fetch SDSM data from SPaT endpoint (vehicles and other objects)
   * @returns Promise with SDSM data including vehicles and pedestrians (VRUs)
   */
  static async fetchSDSMData(): Promise<SDSMResponse | null> {
    try {
      // Create abort controller for timeout (React Native compatible)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(this.API_URL, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache' // Ensure fresh data for 10Hz
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`SDSM API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const rawData: SDSMResponse = await response.json();
      
      if (this.isValidSDSMResponse(rawData)) {
        // Only log summary every 50 requests to avoid spam at 10Hz
        if (Math.random() < 0.02) { // ~2% chance = every 50 requests at 10Hz
          this.logDataSummary(rawData);
        }
        return rawData;
      } else {
        console.warn('Invalid SDSM response structure');
        return null;
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Don't log timeout errors at 10Hz - too spammy
        // console.error('SDSM API request timed out');
      } else {
        console.error('Error fetching SDSM data:', error);
      }
      return null;
    }
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
   * Log summary of the fetched data (throttled for 10Hz)
   */
  private static logDataSummary(data: SDSMResponse): void {
    const vehicles = this.filterVehicles(data);
    const pedestrians = this.filterPedestrians(data);
    
    console.log(`📊 SDSM Data Summary (SPaT endpoint):`);
    console.log(`- Intersection: ${data.intersection} (ID: ${data.intersectionID})`);
    console.log(`- Timestamp: ${data.timestamp}`);
    console.log(`- Total Objects: ${data.objects.length}`);
    console.log(`- Vehicles: ${vehicles.length}`);
    console.log(`- Pedestrians (VRUs): ${pedestrians.length}`);
    
    // Log vehicle positions
    vehicles.forEach(vehicle => {
      console.log(`  🚗 Vehicle ${vehicle.objectID}: [${vehicle.location.coordinates[0]}, ${vehicle.location.coordinates[1]}]`);
    });
  }
  
  /**
   * Filter SDSM data to get only pedestrians (VRUs)
   * @param sdsmData Complete SDSM response
   * @returns Array of pedestrian objects only
   */
  static filterPedestrians(sdsmData: SDSMResponse): SDSMObject[] {
    if (!sdsmData?.objects) {
      return [];
    }
    
    return sdsmData.objects.filter(obj => obj.type === 'vru');
  }
  
  /**
   * Filter SDSM data to get only vehicles
   * @param sdsmData Complete SDSM response  
   * @returns Array of vehicle objects only
   */
  static filterVehicles(sdsmData: SDSMResponse): SDSMObject[] {
    if (!sdsmData?.objects) {
      return [];
    }
    
    return sdsmData.objects.filter(obj => obj.type === 'vehicle');
  }
  
  /**
   * Convert SDSM pedestrian objects to simplified pedestrian info
   * @param sdsmData Complete SDSM response
   * @returns Array of simplified pedestrian data
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
   * @param sdsmData Complete SDSM response
   * @returns Array of simplified vehicle data
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
   * @param sdsmData Complete SDSM response
   * @returns Object with counts and statistics
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
   * @returns Promise<boolean> true if API is reachable and returns valid data
   */
  static async testConnection(): Promise<boolean> {
    try {
      const data = await this.fetchSDSMData();
      return data !== null;
    } catch (error) {
      console.error('SDSM API connection test failed:', error);
      return false;
    }
  }
}