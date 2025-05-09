// app/src/features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { SDSMService } from '../../SDSM/services/SDSMService';
import { INTERSECTION_CENTER, DETECTION_RADIUS } from '../../Crosswalk/constants/CrosswalkCoordinates';

export class PedestrianDetectorViewModel {
  pedestriansInCrosswalk: number = 0;
  isMonitoring: boolean = false;
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 1000; // Check every second
  
  constructor() {
    makeAutoObservable(this);
  }
  
  startMonitoring(): void {
    if (this.isMonitoring) return;
    this.checkForPedestrians();
    this.monitoringInterval = setInterval(() => {
      this.checkForPedestrians();
    }, this.updateFrequency);
    this.isMonitoring = true;
  }
  
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }
  
  /**
   * Simple function to force specific IDs to be "crossing" for testing
   */
  private isForceDetected(id: number): boolean {
    const forceCrossingIds = [507, 38169]; // Test IDs - you can modify this list
    return forceCrossingIds.includes(id);
  }
  
  /**
   * Check for pedestrians (VRUs) in the crosswalk
   */
  private async checkForPedestrians(): Promise<void> {
    try {
      const response = await SDSMService.fetchSDSMData();
      let crossingPedestrians = [];
      
      if (response.success && response.data) {
        for (const object of response.data) {
          // Only check for VRUs (pedestrians)
          if (object.type === 'vru') {
            // First check if we want to force-detect this ID (for testing)
            if (this.isForceDetected(object.objectID)) {
              crossingPedestrians.push({ id: object.objectID });
              continue;
            }
            
            // Otherwise check if it's in the crosswalk by coordinates
            if (object.location?.coordinates?.length === 2) {
              // Create a properly typed coordinate tuple
              const coordinates: [number, number] = [
                object.location.coordinates[0], 
                object.location.coordinates[1]
              ];
              
              // Simple distance check
              const lon = coordinates[0];
              const lat = coordinates[1];
              const centerLat = INTERSECTION_CENTER[0]; 
              const centerLon = INTERSECTION_CENTER[1];
              
              // Convert lat/lon degrees to meters
              const latDiff = (lat - centerLat) * 111000;
              const lonDiff = (lon - centerLon) * 111000 * Math.cos(centerLat * Math.PI / 180);
              const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff);
              
              if (distance <= DETECTION_RADIUS) {
                crossingPedestrians.push({ id: object.objectID });
              }
            }
          }
        }
      }
      
      // Update count and log changes
      const previousCount = this.pedestriansInCrosswalk;
      runInAction(() => {
        this.pedestriansInCrosswalk = crossingPedestrians.length;
      });
      
      // Only log when state changes
      if (crossingPedestrians.length > 0 && (previousCount !== crossingPedestrians.length || previousCount === 0)) {
        console.log(` PEDESTRIAN CROSSING: ${crossingPedestrians.length} pedestrian(s) in intersection!`);
        crossingPedestrians.forEach(ped => {
          console.log(`  - Pedestrian ID ${ped.id} is crossing`);
        });
      } 
      else if (previousCount > 0 && crossingPedestrians.length === 0) {
        console.log('No pedestrians crossing intersection');
      }
    } catch (error) {
      console.error('Error checking for pedestrians:', error);
    }
  }
  
  cleanup(): void {
    this.stopMonitoring();
  }
}