// app/src/features/SDSM/services/SDSMService.ts
import { SDSMResponse, SDSMVehicle } from '../models/SDSMData';

export class SDSMService {
  /**
   * Fetch SDSM data from Redis
   * @returns Promise with SDSM data
   */
  static async fetchSDSMData(): Promise<SDSMResponse> {
    try {
      // Use the Redis endpoint
      const url = 'http://10.199.1.11:9095/latest/sdsm_events';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse the response data
      const rawData = await response.json();
      
      // Handle the new response format with "objects" array
      let vehiclesArray: any[] = [];
      let pedestriansArray: any[] = [];
      
      // Check if the response has an "objects" property that's an array
      if (rawData.objects && Array.isArray(rawData.objects)) {
        // Separate vehicles and pedestrians (VRUs)
        rawData.objects.forEach((obj: any) => {
          if (obj.type === 'vehicle') {
            vehiclesArray.push(obj);
          } else if (obj.type === 'vru') {
            pedestriansArray.push(obj);
          }
        });
      } 
      // Legacy format handling (for backward compatibility)
      else if (Array.isArray(rawData)) {
        // Filter vehicles from the array
        vehiclesArray = rawData.filter(item => item.type === 'vehicle');
        pedestriansArray = rawData.filter(item => item.type === 'vru');
      } 
      // Handle other response formats
      else if (typeof rawData === 'object' && rawData !== null) {
        // Check for any array property that might contain our objects
        for (const key of Object.keys(rawData)) {
          if (Array.isArray(rawData[key])) {
            // Filter the array by type
            vehiclesArray = rawData[key].filter((item: any) => item.type === 'vehicle');
            pedestriansArray = rawData[key].filter((item: any) => item.type === 'vru');
            break;
          }
        }
      }
      
      // Process vehicle data to ensure it matches our expected format
      const transformedData: SDSMVehicle[] = vehiclesArray.map((item: any) => {
        try {
          // Ensure coordinates are in the correct format
          let formattedCoords: [number, number] = [0, 0];
          
          if (item.location?.coordinates) {
            const coords = item.location.coordinates;
            
            // Handle different coordinate formats
            if (Array.isArray(coords)) {
              if (coords.length === 2) {
                // Transform coordinates if needed (original format shows [lat, long], we need [long, lat])
                formattedCoords = [coords[1], coords[0]];
              }
            }
          }
          
          return {
            ...item,
            // Ensure required fields exist
            objectID: item.objectID || 0,
            heading: item.heading || 0,
            speed: item.speed || 0,
            intersection: rawData.intersection || item.intersection || '',
            intersectionID: rawData.intersectionID || item.intersectionID || '',
            location: {
              type: item.location?.type || 'Point',
              coordinates: formattedCoords
            },
            size: item.size || { width: 0, length: 0 }
          };
        } catch (err) {
          console.error('Error processing vehicle:', err);
          return null;
        }
      }).filter(Boolean) as SDSMVehicle[];
      
      // Add pedestrians to the response data
      const allData = [
        ...transformedData,
        ...pedestriansArray.map(ped => ({
          ...ped,
          type: 'vru' // Ensure type is set
        }))
      ];
      
      return {
        success: true,
        count: allData.length,
        data: allData
      };
    } catch (error) {
      console.error('Error fetching SDSM data from Redis:', error);
      // Return empty data structure on error
      return {
        success: false,
        count: 0,
        data: []
      };
    }
  }
}