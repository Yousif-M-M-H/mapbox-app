// app/src/features/ClosestIntersection/viewmodels/ClosestIntersectionViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { INTERSECTION_POLYGONS } from '../constants/IntersectionDefinitions';
import { PolygonDetectionService } from '../services/PolygonDetectionService';
import { VehicleDisplayViewModel } from '../../SDSM/viewmodels/VehicleDisplayViewModel';

export interface LocationProvider {
  (): [number, number]; // Returns [latitude, longitude]
}

export class ClosestIntersectionViewModel {
  // Observable state
  isMonitoring = false;
  isInGeorgiaIntersection = false;
  lastApiCallTime = 0;
  
  // References to other ViewModels
  private vehicleDisplayVM: VehicleDisplayViewModel | null = null;
  
  // Private
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 1000; // 1 second
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Set references to other ViewModels for integration
   */
  setViewModels(vehicleDisplayVM: VehicleDisplayViewModel, spatVM?: any): void {
    this.vehicleDisplayVM = vehicleDisplayVM;
    console.log('🎯 ViewModels linked for Georgia intersection monitoring');
  }
  
  /**
   * Start monitoring user position
   */
  startMonitoring(getUserLocation: LocationProvider): void {
    if (this.isMonitoring) {
      console.log('🎯 Already monitoring Georgia intersection');
      return;
    }
    
    console.log('🎯 Starting Georgia intersection monitoring (1 second intervals)');
    console.log('🎯 Georgia polygon bounds:', PolygonDetectionService.getPolygonBounds(INTERSECTION_POLYGONS[0].polygon));
    
    runInAction(() => {
      this.isMonitoring = true;
    });
    
    // Initial check
    this.checkGeorgiaIntersectionAndCallApis(getUserLocation());
    
    // Set up interval
    this.monitoringInterval = setInterval(() => {
      const userLocation = getUserLocation();
      this.checkGeorgiaIntersectionAndCallApis(userLocation);
    }, this.MONITORING_INTERVAL_MS);
  }
  
  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Stop SDSM when monitoring stops
    if (this.vehicleDisplayVM) {
      this.vehicleDisplayVM.stop();
    }
    
    runInAction(() => {
      this.isMonitoring = false;
      this.isInGeorgiaIntersection = false;
    });
    
    console.log('🎯 Stopped Georgia intersection monitoring');
  }
  
  /**
   * Check if user is in Georgia polygon and make API calls
   */
  private async checkGeorgiaIntersectionAndCallApis(userLocation: [number, number]): Promise<void> {
    try {
      // Get Georgia intersection (first and only one)
      const georgiaIntersection = INTERSECTION_POLYGONS[0];
      
      // Check if user is within Georgia polygon
      const isInGeorgia = PolygonDetectionService.findIntersectionForPosition(
        userLocation,
        INTERSECTION_POLYGONS
      ) !== null;
      
      // Check if state changed
      const hasStateChanged = this.isInGeorgiaIntersection !== isInGeorgia;
      
      if (isInGeorgia) {
        // User entered Georgia intersection
        console.log(`✅ User is within Georgia intersection`);
        
        // Update state
        runInAction(() => {
          this.isInGeorgiaIntersection = true;
          this.lastApiCallTime = Date.now();
        });
        
        // Start SDSM if entering for the first time
        if (hasStateChanged) {
          console.log(`🎯 Entered Georgia intersection - starting SDSM`);
          this.updateSDSMForGeorgia(georgiaIntersection);
        }
        
      } else {
        // User left Georgia intersection
        console.log('User is not within Georgia intersection');
        
        // Stop SDSM if we've left
        if (this.isInGeorgiaIntersection) {
          console.log('🎯 Left Georgia intersection - stopping SDSM');
          if (this.vehicleDisplayVM) {
            this.vehicleDisplayVM.stop();
          }
        }
        
        runInAction(() => {
          this.isInGeorgiaIntersection = false;
        });
      }
    } catch (error) {
      console.error('🎯 Error in Georgia intersection check:', error);
    }
  }
  
  /**
   * Update SDSM VehicleDisplayViewModel for Georgia
   */
  private updateSDSMForGeorgia(intersection: any): void {
    if (!this.vehicleDisplayVM) {
      console.warn('🎯 VehicleDisplayViewModel not set - cannot update SDSM');
      return;
    }
    
    // Stop current SDSM if running
    this.vehicleDisplayVM.stop();
    
    // Set the API URL for Georgia
    this.vehicleDisplayVM.setApiUrl('georgia');
    
    // Start SDSM for Georgia
    this.vehicleDisplayVM.start();
    
    console.log(`🚗 SDSM started for Georgia intersection`);
  }
  
  /**
   * Get current status
   */
  get status(): string {
    if (!this.isMonitoring) return 'Not monitoring';
    if (!this.isInGeorgiaIntersection) return 'Outside Georgia intersection';
    return 'Inside Georgia intersection';
  }
  
  /**
   * Get SDSM status
   */
  get sdsmStatus(): string {
    if (!this.vehicleDisplayVM) return 'SDSM not connected';
    if (!this.vehicleDisplayVM.isActive) return 'SDSM inactive';
    return `SDSM active: ${this.vehicleDisplayVM.vehicleCount} vehicles`;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
    this.vehicleDisplayVM = null;
  }
}