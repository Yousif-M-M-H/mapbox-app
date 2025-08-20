// app/src/features/SpatService/services/SpatDataService.ts

import { SpatData, PhaseTimingInfo } from '../models/SpatModels';

export class SpatDataService {
  private static readonly SPAT_API_URL = 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events';
  private static readonly REQUEST_TIMEOUT = 5000; // 5 second timeout
  
  /**
   * Fetch current SPaT data from endpoint
   */
  public static async fetchSpatData(): Promise<SpatData> {
    try {
      // console.log('🚦 Fetching SPaT data from API...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);
      
      const response = await fetch(this.SPAT_API_URL, {
        method: 'GET',
        headers: { 
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`SPaT API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ SPaT data received:', {
        intersection: data.intersection,
        timestamp: data.timestamp,
        greens: data.phaseStatusGroupGreens,
        reds: data.phaseStatusGroupReds,
        yellows: data.phaseStatusGroupYellows
      });
      
      return this.mapApiResponseToSpatData(data);
      
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ SPaT API request timeout');
        throw new Error('SPaT API request timeout');
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ SPaT fetch failed:', errorMessage);
      throw new Error(`SPaT fetch failed: ${errorMessage}`);
    }
  }
  
  /**
   * Map API response to our SpatData interface
   */
  private static mapApiResponseToSpatData(data: any): SpatData {
    return {
      // Phase status groups (main signal states)
      phaseStatusGroupGreens: data.phaseStatusGroupGreens || [],
      phaseStatusGroupReds: data.phaseStatusGroupReds || [],
      phaseStatusGroupYellows: data.phaseStatusGroupYellows || [],
      
      // Pedestrian signal states
      phaseStatusGroupDontWalks: data.phaseStatusGroupDontWalks || [],
      phaseStatusGroupPedClears: data.phaseStatusGroupPedClears || [],
      phaseStatusGroupWalks: data.phaseStatusGroupWalks || [],
      
      // Overlap signal states
      overlapStatusGroupReds: data.overlapStatusGroupReds || [],
      overlapStatusGroupYellows: data.overlapStatusGroupYellows || [],
      overlapStatusGroupGreens: data.overlapStatusGroupGreens || [],
      
      // System status
      spatIntersectionStatus: data.spatIntersectionStatus || 0,
      phaseBlockCount: data.phaseBlockCount || 0,
      flashingOutputPhaseStatus: data.flashingOutputPhaseStatus || 0,
      flashingOutputOverlapStatus: data.flashingOutputOverlapStatus || 0,
      timebaseAscActionStatus: data.timebaseAscActionStatus || 0,
      spatDiscontinuousChangeFlag: data.spatDiscontinuousChangeFlag || 0,
      spatMessageSeqCounter: data.spatMessageSeqCounter || 0,
      
      // Pedestrian calls/detection
      spatPedestrianCall: data.spatPedestrianCall || 0,
      spatPedestrianDetect: data.spatPedestrianDetect || 0,
      
      // Timing data for all 16 phases
      spatVehMinTimeToChange1: data.spatVehMinTimeToChange1 || 0,
      spatVehMaxTimeToChange1: data.spatVehMaxTimeToChange1 || 0,
      spatPedMinTimeToChange1: data.spatPedMinTimeToChange1 || 0,
      spatPedMaxTimeToChange1: data.spatPedMaxTimeToChange1 || 0,
      spatOvlpMinTimeToChange1: data.spatOvlpMinTimeToChange1 || 0,
      spatOvlpMaxTimeToChange1: data.spatOvlpMaxTimeToChange1 || 0,
      
      spatVehMinTimeToChange2: data.spatVehMinTimeToChange2 || 0,
      spatVehMaxTimeToChange2: data.spatVehMaxTimeToChange2 || 0,
      spatPedMinTimeToChange2: data.spatPedMinTimeToChange2 || 0,
      spatPedMaxTimeToChange2: data.spatPedMaxTimeToChange2 || 0,
      spatOvlpMinTimeToChange2: data.spatOvlpMinTimeToChange2 || 0,
      spatOvlpMaxTimeToChange2: data.spatOvlpMaxTimeToChange2 || 0,
      
      spatVehMinTimeToChange3: data.spatVehMinTimeToChange3 || 0,
      spatVehMaxTimeToChange3: data.spatVehMaxTimeToChange3 || 0,
      spatPedMinTimeToChange3: data.spatPedMinTimeToChange3 || 0,
      spatPedMaxTimeToChange3: data.spatPedMaxTimeToChange3 || 0,
      spatOvlpMinTimeToChange3: data.spatOvlpMinTimeToChange3 || 0,
      spatOvlpMaxTimeToChange3: data.spatOvlpMaxTimeToChange3 || 0,
      
      spatVehMinTimeToChange4: data.spatVehMinTimeToChange4 || 0,
      spatVehMaxTimeToChange4: data.spatVehMaxTimeToChange4 || 0,
      spatPedMinTimeToChange4: data.spatPedMinTimeToChange4 || 0,
      spatPedMaxTimeToChange4: data.spatPedMaxTimeToChange4 || 0,
      spatOvlpMinTimeToChange4: data.spatOvlpMinTimeToChange4 || 0,
      spatOvlpMaxTimeToChange4: data.spatOvlpMaxTimeToChange4 || 0,
      
      spatVehMinTimeToChange5: data.spatVehMinTimeToChange5 || 0,
      spatVehMaxTimeToChange5: data.spatVehMaxTimeToChange5 || 0,
      spatPedMinTimeToChange5: data.spatPedMinTimeToChange5 || 0,
      spatPedMaxTimeToChange5: data.spatPedMaxTimeToChange5 || 0,
      spatOvlpMinTimeToChange5: data.spatOvlpMinTimeToChange5 || 0,
      spatOvlpMaxTimeToChange5: data.spatOvlpMaxTimeToChange5 || 0,
      
      spatVehMinTimeToChange6: data.spatVehMinTimeToChange6 || 0,
      spatVehMaxTimeToChange6: data.spatVehMaxTimeToChange6 || 0,
      spatPedMinTimeToChange6: data.spatPedMinTimeToChange6 || 0,
      spatPedMaxTimeToChange6: data.spatPedMaxTimeToChange6 || 0,
      spatOvlpMinTimeToChange6: data.spatOvlpMinTimeToChange6 || 0,
      spatOvlpMaxTimeToChange6: data.spatOvlpMaxTimeToChange6 || 0,
      
      spatVehMinTimeToChange7: data.spatVehMinTimeToChange7 || 0,
      spatVehMaxTimeToChange7: data.spatVehMaxTimeToChange7 || 0,
      spatPedMinTimeToChange7: data.spatPedMinTimeToChange7 || 0,
      spatPedMaxTimeToChange7: data.spatPedMaxTimeToChange7 || 0,
      spatOvlpMinTimeToChange7: data.spatOvlpMinTimeToChange7 || 0,
      spatOvlpMaxTimeToChange7: data.spatOvlpMaxTimeToChange7 || 0,
      
      spatVehMinTimeToChange8: data.spatVehMinTimeToChange8 || 0,
      spatVehMaxTimeToChange8: data.spatVehMaxTimeToChange8 || 0,
      spatPedMinTimeToChange8: data.spatPedMinTimeToChange8 || 0,
      spatPedMaxTimeToChange8: data.spatPedMaxTimeToChange8 || 0,
      spatOvlpMinTimeToChange8: data.spatOvlpMinTimeToChange8 || 0,
      spatOvlpMaxTimeToChange8: data.spatOvlpMaxTimeToChange8 || 0,
      
      spatVehMinTimeToChange9: data.spatVehMinTimeToChange9 || 0,
      spatVehMaxTimeToChange9: data.spatVehMaxTimeToChange9 || 0,
      spatPedMinTimeToChange9: data.spatPedMinTimeToChange9 || 0,
      spatPedMaxTimeToChange9: data.spatPedMaxTimeToChange9 || 0,
      spatOvlpMinTimeToChange9: data.spatOvlpMinTimeToChange9 || 0,
      spatOvlpMaxTimeToChange9: data.spatOvlpMaxTimeToChange9 || 0,
      
      spatVehMinTimeToChange10: data.spatVehMinTimeToChange10 || 0,
      spatVehMaxTimeToChange10: data.spatVehMaxTimeToChange10 || 0,
      spatPedMinTimeToChange10: data.spatPedMinTimeToChange10 || 0,
      spatPedMaxTimeToChange10: data.spatPedMaxTimeToChange10 || 0,
      spatOvlpMinTimeToChange10: data.spatOvlpMinTimeToChange10 || 0,
      spatOvlpMaxTimeToChange10: data.spatOvlpMaxTimeToChange10 || 0,
      
      spatVehMinTimeToChange11: data.spatVehMinTimeToChange11 || 0,
      spatVehMaxTimeToChange11: data.spatVehMaxTimeToChange11 || 0,
      spatPedMinTimeToChange11: data.spatPedMinTimeToChange11 || 0,
      spatPedMaxTimeToChange11: data.spatPedMaxTimeToChange11 || 0,
      spatOvlpMinTimeToChange11: data.spatOvlpMinTimeToChange11 || 0,
      spatOvlpMaxTimeToChange11: data.spatOvlpMaxTimeToChange11 || 0,
      
      spatVehMinTimeToChange12: data.spatVehMinTimeToChange12 || 0,
      spatVehMaxTimeToChange12: data.spatVehMaxTimeToChange12 || 0,
      spatPedMinTimeToChange12: data.spatPedMinTimeToChange12 || 0,
      spatPedMaxTimeToChange12: data.spatPedMaxTimeToChange12 || 0,
      spatOvlpMinTimeToChange12: data.spatOvlpMinTimeToChange12 || 0,
      spatOvlpMaxTimeToChange12: data.spatOvlpMaxTimeToChange12 || 0,
      
      spatVehMinTimeToChange13: data.spatVehMinTimeToChange13 || 0,
      spatVehMaxTimeToChange13: data.spatVehMaxTimeToChange13 || 0,
      spatPedMinTimeToChange13: data.spatPedMinTimeToChange13 || 0,
      spatPedMaxTimeToChange13: data.spatPedMaxTimeToChange13 || 0,
      spatOvlpMinTimeToChange13: data.spatOvlpMinTimeToChange13 || 0,
      spatOvlpMaxTimeToChange13: data.spatOvlpMaxTimeToChange13 || 0,
      
      spatVehMinTimeToChange14: data.spatVehMinTimeToChange14 || 0,
      spatVehMaxTimeToChange14: data.spatVehMaxTimeToChange14 || 0,
      spatPedMinTimeToChange14: data.spatPedMinTimeToChange14 || 0,
      spatPedMaxTimeToChange14: data.spatPedMaxTimeToChange14 || 0,
      spatOvlpMinTimeToChange14: data.spatOvlpMinTimeToChange14 || 0,
      spatOvlpMaxTimeToChange14: data.spatOvlpMaxTimeToChange14 || 0,
      
      spatVehMinTimeToChange15: data.spatVehMinTimeToChange15 || 0,
      spatVehMaxTimeToChange15: data.spatVehMaxTimeToChange15 || 0,
      spatPedMinTimeToChange15: data.spatPedMinTimeToChange15 || 0,
      spatPedMaxTimeToChange15: data.spatPedMaxTimeToChange15 || 0,
      spatOvlpMinTimeToChange15: data.spatOvlpMinTimeToChange15 || 0,
      spatOvlpMaxTimeToChange15: data.spatOvlpMaxTimeToChange15 || 0,
      
      spatVehMinTimeToChange16: data.spatVehMinTimeToChange16 || 0,
      spatVehMaxTimeToChange16: data.spatVehMaxTimeToChange16 || 0,
      spatPedMinTimeToChange16: data.spatPedMinTimeToChange16 || 0,
      spatPedMaxTimeToChange16: data.spatPedMaxTimeToChange16 || 0,
      spatOvlpMinTimeToChange16: data.spatOvlpMinTimeToChange16 || 0,
      spatOvlpMaxTimeToChange16: data.spatOvlpMaxTimeToChange16 || 0,
      
      // Basic info
      timestamp: data.timestamp || Date.now(),
      intersection: data.intersection || 'Unknown'
    };
  }
  
  /**
   * Extract timing info for a specific phase
   */
  public static getPhaseTimingInfo(spatData: SpatData, phaseId: number): PhaseTimingInfo | null {
    if (phaseId < 1 || phaseId > 16) return null;
    
    const vehMinKey = `spatVehMinTimeToChange${phaseId}` as keyof SpatData;
    const vehMaxKey = `spatVehMaxTimeToChange${phaseId}` as keyof SpatData;
    const pedMinKey = `spatPedMinTimeToChange${phaseId}` as keyof SpatData;
    const pedMaxKey = `spatPedMaxTimeToChange${phaseId}` as keyof SpatData;
    const ovlpMinKey = `spatOvlpMinTimeToChange${phaseId}` as keyof SpatData;
    const ovlpMaxKey = `spatOvlpMaxTimeToChange${phaseId}` as keyof SpatData;
    
    return {
      phaseId,
      vehMinTimeToChange: (spatData[vehMinKey] as number) || 0,
      vehMaxTimeToChange: (spatData[vehMaxKey] as number) || 0,
      pedMinTimeToChange: (spatData[pedMinKey] as number) || 0,
      pedMaxTimeToChange: (spatData[pedMaxKey] as number) || 0,
      ovlpMinTimeToChange: (spatData[ovlpMinKey] as number) || 0,
      ovlpMaxTimeToChange: (spatData[ovlpMaxKey] as number) || 0
    };
  }
  
  /**
   * Test API connectivity
   */
  public static async testConnection(): Promise<boolean> {
    try {
      await this.fetchSpatData();
      console.log('✅ SPaT API connection successful');
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ SPaT API connection failed:', errorMessage);
      return false;
    }
  }
}