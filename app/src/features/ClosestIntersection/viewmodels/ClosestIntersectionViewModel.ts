// app/src/features/ClosestIntersection/viewmodels/ClosestIntersectionViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { INTERSECTIONS } from '../constants/IntersectionDefinitions';
import { DistanceCalculationService } from '../services/DistanceCalculationService';
import { LocationWithHeading, ClosestIntersectionResult } from '../models/IntersectionTypes';

export class ClosestIntersectionViewModel {
  // State
  isMonitoring: boolean = false;
  currentResult: ClosestIntersectionResult | null = null;
  
  // Private
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MONITORING_INTERVAL_MS = 1000; // 1 second
  
  constructor() {
    makeAutoObservable(this);
  }
  
  /**
   * Start monitoring closest intersection
   */
  startMonitoring(getUserLocation: () => LocationWithHeading): void {
    if (this.isMonitoring) {
      console.log('🎯 ClosestIntersection: Already monitoring');
      return;
    }
    
    console.log('🎯 ClosestIntersection: Starting monitoring (1 second intervals)');
    
    runInAction(() => {
      this.isMonitoring = true;
    });
    
    // Initial calculation
    this.calculateAndLog(getUserLocation());
    
    // Set up interval
    this.monitoringInterval = setInterval(() => {
      const userLocation = getUserLocation();
      this.calculateAndLog(userLocation);
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
    
    runInAction(() => {
      this.isMonitoring = false;
      this.currentResult = null;
    });
    
    console.log('🎯 ClosestIntersection: Monitoring stopped');
  }
  
  /**
   * Calculate closest intersection and log result
   */
  private calculateAndLog(userLocation: LocationWithHeading): void {
    try {
      const closestResult = DistanceCalculationService.findClosestIntersection(
        userLocation, 
        INTERSECTIONS
      );
      
      if (!closestResult) {
        console.log('🎯 ClosestIntersection: No intersections found');
        return;
      }
      
      const result: ClosestIntersectionResult = {
        closestIntersection: closestResult.intersection,
        distance: closestResult.distance,
        heading: userLocation.heading,
        timestamp: Date.now()
      };
      
      // Update state
      runInAction(() => {
        this.currentResult = result;
      });
      
      // Log to console (main requirement)
      this.logResult(result);
      
    } catch (error) {
      console.error('🎯 ClosestIntersection Error:', error);
    }
  }
  
  /**
   * Log the result to console (main requirement)
   */
  private logResult(result: ClosestIntersectionResult): void {
    const distanceFormatted = `${result.distance.toFixed(1)}m`;
    const headingInfo = result.heading ? ` (heading: ${result.heading.toFixed(0)}°)` : '';
    
    console.log(
      `🎯 Closest: ${result.closestIntersection.name} - ${distanceFormatted}${headingInfo}`
    );
  }
  
  /**
   * Get current monitoring status
   */
  get monitoringStatus(): string {
    if (!this.isMonitoring) return 'Stopped';
    if (!this.currentResult) return 'Starting...';
    
    const { closestIntersection, distance } = this.currentResult;
    return `Monitoring: ${closestIntersection.name} (${distance.toFixed(1)}m)`;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
  }
}