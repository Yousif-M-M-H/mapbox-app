// app/src/features/SDSM/services/SDSMService.ts
import { SDSMResponse, SDSMVehicle } from '../models/SDSMData';

export class SDSMService {
  /**
   * Fetch SDSM data from Redis
   * @returns Promise with SDSM data
   */
  static async fetchSDSMData(): Promise<SDSMResponse> {
    try {
      console.log('Fetching SDSM data from Redis...');
      
      // Use the Redis endpoint
      const url = 'http://10.199.1.11:9095/latest/sdsm_events';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      // Parse the response data and handle different potential formats
      const rawData = await response.json();
      console.log('Redis SDSM response type:', typeof rawData);
      
      // Debug the structure of the response
      console.log('Redis SDSM response structure:', JSON.stringify(rawData).substring(0, 200) + '...');
      
      // Check if the response is an array
      let vehiclesArray: any[] = [];
      
      if (Array.isArray(rawData)) {
        console.log('Response is an array with', rawData.length, 'items');
        vehiclesArray = rawData;
      } else if (typeof rawData === 'object' && rawData !== null) {
        // It might be an object with an array property
        console.log('Response is an object with keys:', Object.keys(rawData));
        
        // Check if there's a data property that's an array
        if (rawData.data && Array.isArray(rawData.data)) {
          console.log('Found data array with', rawData.data.length, 'items');
          vehiclesArray = rawData.data;
        } else {
          // Look for any array property
          for (const key of Object.keys(rawData)) {
            if (Array.isArray(rawData[key])) {
              console.log(`Found array in property '${key}' with`, rawData[key].length, 'items');
              vehiclesArray = rawData[key];
              break;
            }
          }
          
          // If no array found, convert object to array if it looks like a vehicle
          if (vehiclesArray.length === 0 && rawData.location) {
            console.log('Converting single vehicle object to array');
            vehiclesArray = [rawData];
          }
        }
      }
      
      // Log the first item to debug
      if (vehiclesArray.length > 0) {
        console.log('First SDSM item:', JSON.stringify(vehiclesArray[0]));
      } else {
        console.warn('No vehicles found in the response');
      }
      
      // Process data to ensure it matches our expected format
      const transformedData: SDSMVehicle[] = vehiclesArray.map((item: any) => {
        try {
          // Ensure coordinates are in the correct format
          let formattedCoords: [number, number] = [0, 0];
          
          if (item.location?.coordinates) {
            const coords = item.location.coordinates;
            
            // Handle different coordinate formats
            if (Array.isArray(coords)) {
              if (coords.length === 2) {
                // Your Redis data shows coordinates as [lat, long] but MapboxGL needs [long, lat]
                formattedCoords = [coords[1], coords[0]];
                
                // Log for debugging
                console.log('Original coords:', coords, 'Transformed:', formattedCoords);
              } else {
                console.warn('Invalid coordinate array length:', coords.length);
              }
            } else {
              console.warn('Coordinates is not an array:', coords);
            }
          } else {
            console.warn('No coordinates found for vehicle:', item.objectID);
          }
          
          return {
            ...item,
            // Ensure required fields exist
            objectID: item.objectID || 0,
            heading: item.heading || 0,
            speed: item.speed || 0,
            intersection: item.intersection || '',
            intersectionID: item.intersectionID || '',
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
      
      return {
        success: true,
        count: transformedData.length,
        data: transformedData
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