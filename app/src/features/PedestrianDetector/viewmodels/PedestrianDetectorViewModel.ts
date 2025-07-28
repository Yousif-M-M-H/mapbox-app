// app/src/features/PedestrianDetector/viewModels/PedestrianDetectorViewModel.ts
// Clean main ViewModel that coordinates managers and provides public API

import { makeAutoObservable, runInAction } from 'mobx';
import { PedestrianDataManager, PedestrianData } from './PedestrianDataManager';
import { PedestrianMonitoringManager } from './PedestrianMonitoringManager';
import { CrosswalkDetectionService } from '../services/CrosswalkDetectionService';
import { ProximityDetectionService } from '../services/ProximityDetectionService';
import { PedestrianErrorHandler } from '../errorHandling/PedestrianErrorHandler';

export class PedestrianDetectorViewModel {
  // State
  pedestriansInCrosswalk: number = 0;
  private _vehiclePosition: [number, number] = [0, 0];
  private conditionsMetCallback: (() => void) | null = null;
  
  // Managers
  private dataManager: PedestrianDataManager;
  private monitoringManager: PedestrianMonitoringManager;
  
  constructor() {
    makeAutoObservable(this);
    
    // Initialize managers
    this.dataManager = new PedestrianDataManager();
    this.monitoringManager = new PedestrianMonitoringManager(this.dataManager);
    
    // Setup automatic condition checking when data updates
    this.monitoringManager.setDataUpdateCallback(() => {
      this.checkConditions();
    });
    
    console.log('🚶 PedestrianDetectorViewModel: Initialized with real SDSM data');
  }
  
  // ========================================
  // Public API - Vehicle Position
  // ========================================
  
  /**
   * Get current vehicle position
   */
  get vehiclePosition(): [number, number] {
    return this._vehiclePosition;
  }
  
  /**
   * Set vehicle position and trigger condition check
   */
  setVehiclePosition(position: [number, number]): void {
    this._vehiclePosition = position;
    
    // Check conditions immediately when position updates
    if (this.isMonitoring) {
      this.checkConditions();
    }
  }

  /**
   * Set callback function to be called when conditions are met
   */
  setConditionsMetCallback(callback: () => void): void {
    this.conditionsMetCallback = callback;
  }
  
  // ========================================
  // Public API - Pedestrian Data
  // ========================================
  
  /**
   * Get current pedestrian data
   */
  get pedestrians(): PedestrianData[] {
    return this.dataManager.pedestrians;
  }
  
  /**
   * Get number of pedestrians detected
   */
  get pedestrianCount(): number {
    return this.dataManager.pedestrianCount;
  }
  
  /**
   * Check if vehicle is near any pedestrian
   */
  get isVehicleNearPedestrian(): boolean {
    return ProximityDetectionService.isVehicleNearAnyPedestrian(
      this._vehiclePosition, 
      this.pedestrians
    );
  }
  
  // ========================================
  // Public API - Monitoring
  // ========================================
  
  /**
   * Get monitoring status
   */
  get isMonitoring(): boolean {
    return this.monitoringManager.isActive;
  }
  
  /**
   * Start pedestrian monitoring
   */
  startMonitoring(): void {
    this.monitoringManager.startMonitoring();
  }
  
  /**
   * Stop pedestrian monitoring
   */
  stopMonitoring(): void {
    this.monitoringManager.stopMonitoring();
  }
  
  /**
   * Force refresh pedestrian data
   */
  async refreshData(): Promise<void> {
    await this.monitoringManager.refreshData();
  }
  
  // ========================================
  // Public API - Detection Results
  // ========================================
  
  /**
   * Get pedestrians currently in crosswalk
   */
  getPedestriansInCrosswalk(): PedestrianData[] {
    return CrosswalkDetectionService.getPedestriansInCrosswalk(this.pedestrians);
  }
  
  /**
   * Get pedestrians near vehicle
   */
  getNearbyPedestrians(): PedestrianData[] {
    return ProximityDetectionService.getNearbyPedestrians(
      this._vehiclePosition, 
      this.pedestrians
    );
  }
  
  /**
   * Get detailed proximity info for all pedestrians
   */
  getProximityInfo(): Array<{
    isClose: boolean;
    distanceMeters: number;
    pedestrianId: number;
  }> {
    return this.pedestrians.map(pedestrian => 
      ProximityDetectionService.getProximityInfo(
        this._vehiclePosition,
        pedestrian.coordinates,
        pedestrian.id
      )
    );
  }
  
  // ========================================
  // Public API - State Information
  // ========================================
  
  /**
   * Get loading status
   */
  get loading(): boolean {
    return this.dataManager.loading;
  }
  
  /**
   * Get error status
   */
  get error(): string | null {
    return this.dataManager.error;
  }
  
  /**
   * Check if data is fresh
   */
  get isDataFresh(): boolean {
    return this.dataManager.isDataFresh();
  }
  
  /**
   * Get data age in milliseconds
   */
  get dataAge(): number {
    return this.dataManager.getDataAge();
  }
  
  // ========================================
  // Private Methods
  // ========================================
  
  /**
   * Check conditions and update crosswalk count
   */
  private checkConditions(): void {
    try {
      let pedestriansInCrosswalkCount = 0;
      let hasCloseVehicle = false;
      let hasMetConditions = false;
      
      // Check each pedestrian
      this.pedestrians.forEach(pedestrian => {
        const isInCrosswalk = CrosswalkDetectionService.isInCrosswalk(pedestrian.coordinates);
        const isCloseToVehicle = ProximityDetectionService.isVehicleCloseToPosition(
          this._vehiclePosition, 
          pedestrian.coordinates
        );
        
        if (isInCrosswalk) {
          pedestriansInCrosswalkCount++;
          console.log(`🚶 Pedestrian ${pedestrian.id} is in crosswalk at [${pedestrian.coordinates[0]}, ${pedestrian.coordinates[1]}]`);
        }
        
        if (isCloseToVehicle) {
          hasCloseVehicle = true;
          ProximityDetectionService.logProximityWarning(
            this._vehiclePosition,
            pedestrian.coordinates,
            pedestrian.id
          );
        }
        
        // Check if conditions are met (pedestrian in crosswalk AND vehicle is close)
        if (isInCrosswalk && isCloseToVehicle) {
          hasMetConditions = true;
          const distance = ProximityDetectionService.getDistanceInMeters(
            this._vehiclePosition,
            pedestrian.coordinates
          );
          
          console.log(`\n🔴 WARNING: Pedestrian ${pedestrian.id} is crossing and vehicle is approaching (${distance.toFixed(2)} meters away)!`);
        }
      });
      
      // Update the observable state
      runInAction(() => {
        this.pedestriansInCrosswalk = pedestriansInCrosswalkCount;
      });
      
      //console.log(`📊 Status: ${pedestriansInCrosswalkCount} pedestrians in crosswalk, vehicle proximity: ${hasCloseVehicle}`);
      
      // Call the callback if conditions are met
      if (hasMetConditions && this.conditionsMetCallback) {
        try {
          this.conditionsMetCallback();
        } catch (error) {
          console.error('Error calling conditions met callback:', error);
        }
      }
      
    } catch (error) {
      PedestrianErrorHandler.logError('checkConditions', error);
    }
  }
  
  // ========================================
  // Cleanup
  // ========================================
  
  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.monitoringManager.cleanup();
    this.conditionsMetCallback = null;
    
    runInAction(() => {
      this.pedestriansInCrosswalk = 0;
      this._vehiclePosition = [0, 0];
    });
    
    console.log('🚶 PedestrianDetectorViewModel: Cleaned up');
  }
}