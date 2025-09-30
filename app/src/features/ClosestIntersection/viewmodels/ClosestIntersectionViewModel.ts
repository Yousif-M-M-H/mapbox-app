// app/src/features/ClosestIntersection/viewmodels/ClosestIntersectionViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { INTERSECTION_POLYGONS, IntersectionPolygon } from '../constants/IntersectionDefinitions';
import { PolygonDetectionService } from '../services/PolygonDetectionService';
import { VehicleDisplayViewModel } from '../../SDSM/viewmodels/VehicleDisplayViewModel';

export interface LocationProvider {
  (): [number, number]; // Returns [latitude, longitude]
}

export class ClosestIntersectionViewModel {
  // Observable state
  isMonitoring = false;
  currentIntersection: IntersectionPolygon | null = null;
  previousIntersection: IntersectionPolygon | null = null;
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
   * NOTE: SPaT is now self-contained and doesn't need to be linked here
   */
  setViewModels(vehicleDisplayVM: VehicleDisplayViewModel, spatVM?: any): void {
    this.vehicleDisplayVM = vehicleDisplayVM;
    console.log('🎯 ViewModels linked for intersection monitoring');
  }
  
  /**
   * Start monitoring user position and making API calls
   */
  startMonitoring(getUserLocation: LocationProvider): void {
    if (this.isMonitoring) {
      console.log('🎯 Already monitoring intersections');
      return;
    }
    
    console.log('🎯 Starting intersection monitoring (1 second intervals)');
    console.log('🎯 Georgia polygon bounds:', PolygonDetectionService.getPolygonBounds(INTERSECTION_POLYGONS[0].polygon));
    console.log('🎯 Houston polygon bounds:', PolygonDetectionService.getPolygonBounds(INTERSECTION_POLYGONS[1].polygon));
    
    runInAction(() => {
      this.isMonitoring = true;
    });
    
    // Initial check
    this.checkIntersectionAndCallApis(getUserLocation());
    
    // Set up interval
    this.monitoringInterval = setInterval(() => {
      const userLocation = getUserLocation();
      this.checkIntersectionAndCallApis(userLocation);
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
      this.currentIntersection = null;
      this.previousIntersection = null;
    });
    
    console.log('🎯 Stopped intersection monitoring');
  }
  
  /**
   * Check which intersection polygon contains the user and make API calls
   */
  private async checkIntersectionAndCallApis(userLocation: [number, number]): Promise<void> {
    try {
      // Find which intersection polygon the user is in
      const intersection = PolygonDetectionService.findIntersectionForPosition(
        userLocation,
        INTERSECTION_POLYGONS
      );
      
      // Check if we've changed intersections
      const hasChangedIntersection = this.hasIntersectionChanged(intersection);
      
      if (intersection) {
        // User is within an intersection polygon
        console.log(`User is within: ${intersection.name}`);
        
        // Update current intersection
        runInAction(() => {
          this.previousIntersection = this.currentIntersection;
          this.currentIntersection = intersection;
          this.lastApiCallTime = Date.now();
        });
        
        // If we've entered a new intersection, update SDSM immediately
        if (hasChangedIntersection) {
          console.log(`🎯 Intersection changed to: ${intersection.name}`);
          this.updateSDSMForIntersection(intersection);
          
          // Note: SPaT now handles its own intersection detection
          // No need to notify SPaT here
        }
        
      } else {
        // User is not in any intersection polygon
        console.log('User is not within any intersection polygon');
        
        // Stop SDSM if we've left all intersections
        if (this.currentIntersection !== null) {
          console.log('🎯 Left all intersection zones - stopping SDSM');
          if (this.vehicleDisplayVM) {
            this.vehicleDisplayVM.stop();
          }
        }
        
        runInAction(() => {
          this.previousIntersection = this.currentIntersection;
          this.currentIntersection = null;
        });
      }
    } catch (error) {
      console.error('🎯 Error in intersection check:', error);
    }
  }
  
  /**
   * Check if intersection has changed
   */
  private hasIntersectionChanged(newIntersection: IntersectionPolygon | null): boolean {
    if (!this.currentIntersection && !newIntersection) return false;
    if (!this.currentIntersection || !newIntersection) return true;
    return this.currentIntersection.id !== newIntersection.id;
  }
  
  /**
   * Update SDSM VehicleDisplayViewModel for the current intersection
   */
  private updateSDSMForIntersection(intersection: IntersectionPolygon): void {
    if (!this.vehicleDisplayVM) {
      console.warn('🎯 VehicleDisplayViewModel not set - cannot update SDSM');
      return;
    }
    
    // Stop current SDSM if running
    this.vehicleDisplayVM.stop();
    
    // Set the API URL for the specific intersection
    this.vehicleDisplayVM.setApiUrl(intersection.id as 'georgia' | 'houston');
    
    // Start SDSM for the new intersection
    this.vehicleDisplayVM.start();
    
    console.log(`🚗 SDSM started for ${intersection.name} intersection`);
  }
  
  /**
   * Get current status
   */
  get status(): string {
    if (!this.isMonitoring) return 'Not monitoring';
    if (!this.currentIntersection) return 'Outside intersection zones';
    return `Inside ${this.currentIntersection.name} intersection`;
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