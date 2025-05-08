// app/src/features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { SDSMService } from '../../SDSM/services/SDSMService';
import { isPointInCrosswalk } from '../../Crosswalk/utils/GeoUtils';

export class PedestrianDetectorViewModel {
  pedestriansInCrosswalk: number = 0;
  isMonitoring: boolean = false;
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 1000; // Check every second
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Start monitoring for pedestrians in the crosswalk
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    // Do an initial check
    this.checkForPedestrians();
    
    // Set up interval for future checks
    this.monitoringInterval = setInterval(() => {
      this.checkForPedestrians();
    }, this.updateFrequency);
    
    this.isMonitoring = true;
  }
  
  /**
   * Stop monitoring for pedestrians
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
  }
  
  /**
   * Check for pedestrians in the crosswalk
   */
  private async checkForPedestrians(): Promise<void> {
    try {
      // Get pedestrian data using the existing SDSMService
      const response = await SDSMService.fetchSDSMData();
      
      // Count pedestrians in crosswalk
      let pedestriansCount = 0;
      let pedestriansInCrosswalk: any[] = [];
      
      if (response.success && response.data) {
        for (const object of response.data) {
          if (object.type === 'vru') {
            // Check if this pedestrian is in the crosswalk
            if (isPointInCrosswalk(object.location.coordinates)) {
              pedestriansCount++;
              pedestriansInCrosswalk.push({
                id: object.objectID,
                coordinates: object.location.coordinates
              });
            }
          }
        }
      }
      
      // Update state
      runInAction(() => {
        // If the count changed, log it
        if (this.pedestriansInCrosswalk !== pedestriansCount) {
          this.pedestriansInCrosswalk = pedestriansCount;
          
          // Log only when pedestrians are crossing
          if (pedestriansCount > 0) {
            console.log(`🚨 CROSSWALK ALERT: ${pedestriansCount} pedestrian(s) detected crossing at MLK & Central!`);
            
            // Log each pedestrian's details
            pedestriansInCrosswalk.forEach(ped => {
              console.log(`  - Pedestrian ID ${ped.id} at coordinates [${ped.coordinates[0]}, ${ped.coordinates[1]}]`);
            });
          } else if (this.pedestriansInCrosswalk > 0) {
            // Only log when changing from pedestrians to zero
            console.log('✅ Crosswalk clear - no pedestrians detected.');
          }
        }
      });
    } catch (error) {
      console.error('Error checking for pedestrians:', error);
    }
  }
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    this.stopMonitoring();
  }
}




