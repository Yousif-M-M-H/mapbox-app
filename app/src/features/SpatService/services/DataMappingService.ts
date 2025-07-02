// app/src/features/SpatService/services/DataMappingService.ts
// Handles data transformation and mapping

import { SpatData, PhaseTimingInfo } from '../models/SpatModels';

export class DataMappingService {
  
  /**
   * Map raw API response to SpatData interface
   */
  public static mapApiResponseToSpatData(rawData: any): SpatData {
    return {
      // Phase status groups (main signal states)
      phaseStatusGroupGreens: rawData.phaseStatusGroupGreens || [],
      phaseStatusGroupReds: rawData.phaseStatusGroupReds || [],
      phaseStatusGroupYellows: rawData.phaseStatusGroupYellows || [],
      
      // Pedestrian signal states
      phaseStatusGroupDontWalks: rawData.phaseStatusGroupDontWalks || [],
      phaseStatusGroupPedClears: rawData.phaseStatusGroupPedClears || [],
      phaseStatusGroupWalks: rawData.phaseStatusGroupWalks || [],
      
      // Overlap signal states
      overlapStatusGroupReds: rawData.overlapStatusGroupReds || [],
      overlapStatusGroupYellows: rawData.overlapStatusGroupYellows || [],
      overlapStatusGroupGreens: rawData.overlapStatusGroupGreens || [],
      
      // System status
      spatIntersectionStatus: rawData.spatIntersectionStatus || 0,
      phaseBlockCount: rawData.phaseBlockCount || 0,
      flashingOutputPhaseStatus: rawData.flashingOutputPhaseStatus || 0,
      flashingOutputOverlapStatus: rawData.flashingOutputOverlapStatus || 0,
      timebaseAscActionStatus: rawData.timebaseAscActionStatus || 0,
      spatDiscontinuousChangeFlag: rawData.spatDiscontinuousChangeFlag || 0,
      spatMessageSeqCounter: rawData.spatMessageSeqCounter || 0,
      
      // Pedestrian calls/detection
      spatPedestrianCall: rawData.spatPedestrianCall || 0,
      spatPedestrianDetect: rawData.spatPedestrianDetect || 0,
      
      // Timing data for all 16 phases - explicitly mapped
      spatVehMinTimeToChange1: rawData.spatVehMinTimeToChange1 || 0,
      spatVehMaxTimeToChange1: rawData.spatVehMaxTimeToChange1 || 0,
      spatPedMinTimeToChange1: rawData.spatPedMinTimeToChange1 || 0,
      spatPedMaxTimeToChange1: rawData.spatPedMaxTimeToChange1 || 0,
      spatOvlpMinTimeToChange1: rawData.spatOvlpMinTimeToChange1 || 0,
      spatOvlpMaxTimeToChange1: rawData.spatOvlpMaxTimeToChange1 || 0,
      
      spatVehMinTimeToChange2: rawData.spatVehMinTimeToChange2 || 0,
      spatVehMaxTimeToChange2: rawData.spatVehMaxTimeToChange2 || 0,
      spatPedMinTimeToChange2: rawData.spatPedMinTimeToChange2 || 0,
      spatPedMaxTimeToChange2: rawData.spatPedMaxTimeToChange2 || 0,
      spatOvlpMinTimeToChange2: rawData.spatOvlpMinTimeToChange2 || 0,
      spatOvlpMaxTimeToChange2: rawData.spatOvlpMaxTimeToChange2 || 0,
      
      spatVehMinTimeToChange3: rawData.spatVehMinTimeToChange3 || 0,
      spatVehMaxTimeToChange3: rawData.spatVehMaxTimeToChange3 || 0,
      spatPedMinTimeToChange3: rawData.spatPedMinTimeToChange3 || 0,
      spatPedMaxTimeToChange3: rawData.spatPedMaxTimeToChange3 || 0,
      spatOvlpMinTimeToChange3: rawData.spatOvlpMinTimeToChange3 || 0,
      spatOvlpMaxTimeToChange3: rawData.spatOvlpMaxTimeToChange3 || 0,
      
      spatVehMinTimeToChange4: rawData.spatVehMinTimeToChange4 || 0,
      spatVehMaxTimeToChange4: rawData.spatVehMaxTimeToChange4 || 0,
      spatPedMinTimeToChange4: rawData.spatPedMinTimeToChange4 || 0,
      spatPedMaxTimeToChange4: rawData.spatPedMaxTimeToChange4 || 0,
      spatOvlpMinTimeToChange4: rawData.spatOvlpMinTimeToChange4 || 0,
      spatOvlpMaxTimeToChange4: rawData.spatOvlpMaxTimeToChange4 || 0,
      
      spatVehMinTimeToChange5: rawData.spatVehMinTimeToChange5 || 0,
      spatVehMaxTimeToChange5: rawData.spatVehMaxTimeToChange5 || 0,
      spatPedMinTimeToChange5: rawData.spatPedMinTimeToChange5 || 0,
      spatPedMaxTimeToChange5: rawData.spatPedMaxTimeToChange5 || 0,
      spatOvlpMinTimeToChange5: rawData.spatOvlpMinTimeToChange5 || 0,
      spatOvlpMaxTimeToChange5: rawData.spatOvlpMaxTimeToChange5 || 0,
      
      spatVehMinTimeToChange6: rawData.spatVehMinTimeToChange6 || 0,
      spatVehMaxTimeToChange6: rawData.spatVehMaxTimeToChange6 || 0,
      spatPedMinTimeToChange6: rawData.spatPedMinTimeToChange6 || 0,
      spatPedMaxTimeToChange6: rawData.spatPedMaxTimeToChange6 || 0,
      spatOvlpMinTimeToChange6: rawData.spatOvlpMinTimeToChange6 || 0,
      spatOvlpMaxTimeToChange6: rawData.spatOvlpMaxTimeToChange6 || 0,
      
      spatVehMinTimeToChange7: rawData.spatVehMinTimeToChange7 || 0,
      spatVehMaxTimeToChange7: rawData.spatVehMaxTimeToChange7 || 0,
      spatPedMinTimeToChange7: rawData.spatPedMinTimeToChange7 || 0,
      spatPedMaxTimeToChange7: rawData.spatPedMaxTimeToChange7 || 0,
      spatOvlpMinTimeToChange7: rawData.spatOvlpMinTimeToChange7 || 0,
      spatOvlpMaxTimeToChange7: rawData.spatOvlpMaxTimeToChange7 || 0,
      
      spatVehMinTimeToChange8: rawData.spatVehMinTimeToChange8 || 0,
      spatVehMaxTimeToChange8: rawData.spatVehMaxTimeToChange8 || 0,
      spatPedMinTimeToChange8: rawData.spatPedMinTimeToChange8 || 0,
      spatPedMaxTimeToChange8: rawData.spatPedMaxTimeToChange8 || 0,
      spatOvlpMinTimeToChange8: rawData.spatOvlpMinTimeToChange8 || 0,
      spatOvlpMaxTimeToChange8: rawData.spatOvlpMaxTimeToChange8 || 0,
      
      spatVehMinTimeToChange9: rawData.spatVehMinTimeToChange9 || 0,
      spatVehMaxTimeToChange9: rawData.spatVehMaxTimeToChange9 || 0,
      spatPedMinTimeToChange9: rawData.spatPedMinTimeToChange9 || 0,
      spatPedMaxTimeToChange9: rawData.spatPedMaxTimeToChange9 || 0,
      spatOvlpMinTimeToChange9: rawData.spatOvlpMinTimeToChange9 || 0,
      spatOvlpMaxTimeToChange9: rawData.spatOvlpMaxTimeToChange9 || 0,
      
      spatVehMinTimeToChange10: rawData.spatVehMinTimeToChange10 || 0,
      spatVehMaxTimeToChange10: rawData.spatVehMaxTimeToChange10 || 0,
      spatPedMinTimeToChange10: rawData.spatPedMinTimeToChange10 || 0,
      spatPedMaxTimeToChange10: rawData.spatPedMaxTimeToChange10 || 0,
      spatOvlpMinTimeToChange10: rawData.spatOvlpMinTimeToChange10 || 0,
      spatOvlpMaxTimeToChange10: rawData.spatOvlpMaxTimeToChange10 || 0,
      
      spatVehMinTimeToChange11: rawData.spatVehMinTimeToChange11 || 0,
      spatVehMaxTimeToChange11: rawData.spatVehMaxTimeToChange11 || 0,
      spatPedMinTimeToChange11: rawData.spatPedMinTimeToChange11 || 0,
      spatPedMaxTimeToChange11: rawData.spatPedMaxTimeToChange11 || 0,
      spatOvlpMinTimeToChange11: rawData.spatOvlpMinTimeToChange11 || 0,
      spatOvlpMaxTimeToChange11: rawData.spatOvlpMaxTimeToChange11 || 0,
      
      spatVehMinTimeToChange12: rawData.spatVehMinTimeToChange12 || 0,
      spatVehMaxTimeToChange12: rawData.spatVehMaxTimeToChange12 || 0,
      spatPedMinTimeToChange12: rawData.spatPedMinTimeToChange12 || 0,
      spatPedMaxTimeToChange12: rawData.spatPedMaxTimeToChange12 || 0,
      spatOvlpMinTimeToChange12: rawData.spatOvlpMinTimeToChange12 || 0,
      spatOvlpMaxTimeToChange12: rawData.spatOvlpMaxTimeToChange12 || 0,
      
      spatVehMinTimeToChange13: rawData.spatVehMinTimeToChange13 || 0,
      spatVehMaxTimeToChange13: rawData.spatVehMaxTimeToChange13 || 0,
      spatPedMinTimeToChange13: rawData.spatPedMinTimeToChange13 || 0,
      spatPedMaxTimeToChange13: rawData.spatPedMaxTimeToChange13 || 0,
      spatOvlpMinTimeToChange13: rawData.spatOvlpMinTimeToChange13 || 0,
      spatOvlpMaxTimeToChange13: rawData.spatOvlpMaxTimeToChange13 || 0,
      
      spatVehMinTimeToChange14: rawData.spatVehMinTimeToChange14 || 0,
      spatVehMaxTimeToChange14: rawData.spatVehMaxTimeToChange14 || 0,
      spatPedMinTimeToChange14: rawData.spatPedMinTimeToChange14 || 0,
      spatPedMaxTimeToChange14: rawData.spatPedMaxTimeToChange14 || 0,
      spatOvlpMinTimeToChange14: rawData.spatOvlpMinTimeToChange14 || 0,
      spatOvlpMaxTimeToChange14: rawData.spatOvlpMaxTimeToChange14 || 0,
      
      spatVehMinTimeToChange15: rawData.spatVehMinTimeToChange15 || 0,
      spatVehMaxTimeToChange15: rawData.spatVehMaxTimeToChange15 || 0,
      spatPedMinTimeToChange15: rawData.spatPedMinTimeToChange15 || 0,
      spatPedMaxTimeToChange15: rawData.spatPedMaxTimeToChange15 || 0,
      spatOvlpMinTimeToChange15: rawData.spatOvlpMinTimeToChange15 || 0,
      spatOvlpMaxTimeToChange15: rawData.spatOvlpMaxTimeToChange15 || 0,
      
      spatVehMinTimeToChange16: rawData.spatVehMinTimeToChange16 || 0,
      spatVehMaxTimeToChange16: rawData.spatVehMaxTimeToChange16 || 0,
      spatPedMinTimeToChange16: rawData.spatPedMinTimeToChange16 || 0,
      spatPedMaxTimeToChange16: rawData.spatPedMaxTimeToChange16 || 0,
      spatOvlpMinTimeToChange16: rawData.spatOvlpMinTimeToChange16 || 0,
      spatOvlpMaxTimeToChange16: rawData.spatOvlpMaxTimeToChange16 || 0,
      
      // Basic info
      timestamp: rawData.timestamp || Date.now(),
      intersection: rawData.intersection || 'Unknown'
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
}}