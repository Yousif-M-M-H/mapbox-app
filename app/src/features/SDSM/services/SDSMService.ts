// app/src/features/SDSM/services/SDSMService.ts
export class SDSMService {
  /**
   * Fetch SDSM data from Redis
   * @returns Promise with SDSM data
   */
  static async fetchSDSMData(): Promise<any> {
    try {
      // Use the Redis endpoint
      const url = 'http://10.199.1.11:9095/latest/sdsm_events';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        return { success: false, data: [] };
      }
      
      // Parse the response data with try/catch
      let rawData;
      try {
        rawData = await response.json();
      } catch (error) {
        console.error('Error parsing JSON response:', error);
        return { success: false, data: [] };
      }
      
      // Make sure the data is structured in a way we can use
      let objects = [];
      
      try {
        if (rawData && typeof rawData === 'object') {
          if (rawData.objects && Array.isArray(rawData.objects)) {
            objects = rawData.objects;
          } else if (Array.isArray(rawData)) {
            objects = rawData;
          } else {
            // Look for any array property
            for (const key of Object.keys(rawData)) {
              if (rawData[key] && Array.isArray(rawData[key])) {
                objects = rawData[key];
                break;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error processing data structure:', error);
      }
      
      // Ensure objects is always an array
      if (!Array.isArray(objects)) {
        objects = [];
      }
      
      return {
        success: true,
        count: objects.length,
        data: objects
      };
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