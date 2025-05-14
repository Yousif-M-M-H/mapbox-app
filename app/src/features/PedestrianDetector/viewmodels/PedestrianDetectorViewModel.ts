// app/src/features/PedestrianDetector/viewmodels/PedestrianDetectorViewModel.ts
import { makeAutoObservable } from 'mobx';
import { SDSMService } from '../../SDSM/services/SDSMService';
import { CAR_POSITION, CROSSWALK_CENTER, DETECTION_RADIUS } from '../../Crosswalk/constants/CrosswalkCoordinates';

export class PedestrianDetectorViewModel {
  isMonitoring: boolean = false;
  pedestriansInCrosswalk: number = 0;
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private updateFrequency: number = 500; // Refresh twice per second
  
  constructor() {
    makeAutoObservable(this);
    console.log(`🚗 Car position: [${CAR_POSITION[0]}, ${CAR_POSITION[1]}]`);
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
   * Simple distance calculation between two points
   */
  private distanceBetweenPoints(
    lat1: number, lon1: number, 
    lat2: number, lon2: number
  ): number {
    return Math.sqrt(
      Math.pow(lat2 - lat1, 2) + 
      Math.pow(lon2 - lon1, 2)
    );
  }
  
  /**
   * Check if a point is near the crosswalk
   */
  private isPointNearCrosswalk(coordinates: [number, number]): boolean {
    try {
      if (!coordinates || coordinates.length !== 2) return false;
      
      const lat = coordinates[0];
      const lon = coordinates[1];
      
      if (typeof lat !== 'number' || typeof lon !== 'number') return false;
      
      // Crosswalk center is [longitude, latitude]
      const crosswalkLat = CROSSWALK_CENTER[1];
      const crosswalkLon = CROSSWALK_CENTER[0];
      
      const distance = this.distanceBetweenPoints(lat, lon, crosswalkLat, crosswalkLon);
      return distance < DETECTION_RADIUS;
    } catch (error) {
      console.error('Error checking if point is near crosswalk:', error);
      return false;
    }
  }
  
  /**
   * Check for pedestrians in the crosswalk - only logs to console
   */
  private async checkForPedestrians(): Promise<void> {
    try {
      const response = await SDSMService.fetchSDSMData();
      const pedestriansInCrosswalk: any[] = [];
      
      if (response.success && response.data && Array.isArray(response.data)) {
        // Process each object
        for (let i = 0; i < response.data.length; i++) {
          try {
            const object = response.data[i];
            
            // Skip if not a VRU
            if (!object || !object.type || object.type !== 'vru') continue;
            
            // Skip if no valid coordinates
            if (!object.location || 
                !object.location.coordinates || 
                !Array.isArray(object.location.coordinates) || 
                object.location.coordinates.length !== 2) continue;
            
            const coordinates: [number, number] = [
              object.location.coordinates[0],
              object.location.coordinates[1]
            ];
            
            // Check if pedestrian is in crosswalk
            if (this.isPointNearCrosswalk(coordinates)) {
              pedestriansInCrosswalk.push({
                id: object.objectID || Math.floor(Math.random() * 10000),
                coordinates: coordinates
              });
            }
          } catch (error) {
            console.error('Error processing pedestrian data:', error);
          }
        }
      }
      
      // Update count
      const previousCount = this.pedestriansInCrosswalk;
      this.pedestriansInCrosswalk = pedestriansInCrosswalk.length;
      
      // Log warning when a pedestrian is in the crosswalk - only update console when count changes
      if (pedestriansInCrosswalk.length > 0) {
        if (previousCount !== pedestriansInCrosswalk.length || previousCount === 0) {
          console.log(`\n⚠️ WARNING FOR DRIVER: ${pedestriansInCrosswalk.length} pedestrian(s) crossing the crosswalk ahead!`);
          
          pedestriansInCrosswalk.forEach(ped => {
            console.log(`  - Pedestrian ID ${ped.id} is crossing at [${ped.coordinates[0]}, ${ped.coordinates[1]}]`);
          });
        }
      }
      else if (previousCount > 0 && pedestriansInCrosswalk.length === 0) {
        console.log('\n✅ Crosswalk is now clear');
      }
    } catch (error) {
      console.error('Error checking for pedestrians:', error);
    }
  }
  
  cleanup(): void {
    this.stopMonitoring();
  }
}