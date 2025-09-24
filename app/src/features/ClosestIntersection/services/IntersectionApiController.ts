// app/src/features/ClosestIntersection/services/IntersectionApiController.ts
//
// Smart Intersection API Controller
//
// Monitors vehicle location and heading to determine which intersection (Georgia or Houston)
// the user is closest to and heading toward. Only activates APIs for the selected intersection
// to conserve resources and avoid unnecessary API calls.
//
// Logic:
// 1. Check distance to both intersections (60m threshold)
// 2. Check heading direction (45° tolerance)
// 3. Score intersections: 70% distance + 30% heading alignment
// 4. Select best intersection and activate corresponding APIs:
//    - Georgia: MLK_Georgia SDSM + SPAT endpoints
//    - Houston: MLK_Houston SDSM + SPAT endpoints
// 5. Stop APIs when moving away from all intersections

import { INTERSECTIONS } from '../constants/IntersectionDefinitions';
import { DistanceCalculationService } from './DistanceCalculationService';
import { LocationWithHeading } from '../models/IntersectionTypes';
import { VehicleDisplayViewModel } from '../../SDSM/viewmodels/VehicleDisplayViewModel';

interface IntersectionAction {
  intersectionId: string;
  intersectionName: string;
  distance: number;
  action: 'call_georgia_apis' | 'call_houston_apis' | 'no_action';
}

export class IntersectionApiController {
  private static readonly PROXIMITY_THRESHOLD = 60; // 60 meters
  private static readonly HEADING_TOLERANCE = 45; // degrees
  private static isMonitoring = false;
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static readonly MONITORING_INTERVAL_MS = 1000; // 1 second
  private static vehicleDisplayViewModel: VehicleDisplayViewModel | null = null;
  private static currentActiveIntersection: string | null = null;

  /**
   * Start monitoring intersection proximity and making conditional API calls
   */
  public static startConditionalApiCalling(
    getUserLocation: () => LocationWithHeading,
    vehicleDisplayVM: VehicleDisplayViewModel
  ): void {
    if (this.isMonitoring) {
      console.log('🎯 IntersectionApiController: Already monitoring');
      return;
    }

    console.log('🎯 IntersectionApiController: Starting conditional API monitoring');
    this.isMonitoring = true;
    this.vehicleDisplayViewModel = vehicleDisplayVM;

    // Initial check
    this.checkIntersectionProximityAndAct(getUserLocation);

    // Set up interval monitoring
    this.monitoringInterval = setInterval(() => {
      this.checkIntersectionProximityAndAct(getUserLocation);
    }, this.MONITORING_INTERVAL_MS);
  }

  /**
   * Stop monitoring
   */
  public static stopConditionalApiCalling(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    this.isMonitoring = false;
    console.log('🎯 IntersectionApiController: Monitoring stopped');
  }

  /**
   * Check intersection proximity and take appropriate action
   */
  private static async checkIntersectionProximityAndAct(getUserLocation: () => LocationWithHeading): Promise<void> {
    try {
      const userLocation = getUserLocation();
      const action = this.determineIntersectionAction(userLocation);

      if (action) {
        await this.executeAction(action);
      } else {
        // No intersection in range - stop any active APIs
        if (this.currentActiveIntersection && this.vehicleDisplayViewModel) {
          console.log('🎯 Moving away from intersections - Stopping APIs');
          this.vehicleDisplayViewModel.stop();
          this.currentActiveIntersection = null;
        }
      }
    } catch (error) {
      console.error('🎯 IntersectionApiController Error:', error);
    }
  }

  /**
   * Determine which intersection is closest based on distance and heading
   */
  private static determineIntersectionAction(userLocation: LocationWithHeading): IntersectionAction | null {
    const { coordinates, heading } = userLocation;

    interface IntersectionCandidate {
      intersection: any;
      distance: number;
      headingDiff?: number;
      score: number; // Lower is better (combines distance and heading)
    }

    const candidates: IntersectionCandidate[] = [];

    // Evaluate each intersection
    for (const intersection of INTERSECTIONS) {
      const distance = DistanceCalculationService.calculateDistance(coordinates, intersection.coordinates);

      // Skip if too far away
      if (distance > this.PROXIMITY_THRESHOLD) {
        continue;
      }

      let headingDiff: number | undefined;
      let score = distance; // Base score is distance

      // If heading is available, factor it into the decision
      if (heading !== undefined) {
        const bearing = DistanceCalculationService.calculateBearing(coordinates, intersection.coordinates);
        headingDiff = this.getHeadingDifference(heading, bearing);

        // Skip if not heading toward intersection
        if (headingDiff > this.HEADING_TOLERANCE) {
          continue;
        }

        // Combine distance and heading into a score (lower is better)
        // Weight: 70% distance, 30% heading alignment
        const normalizedHeading = headingDiff / this.HEADING_TOLERANCE; // 0 = perfect alignment, 1 = max tolerance
        score = (distance * 0.7) + (normalizedHeading * distance * 0.3);
      }

      candidates.push({
        intersection,
        distance,
        headingDiff,
        score
      });
    }

    // No candidates found
    if (candidates.length === 0) {
      return null;
    }

    // Find the best candidate (lowest score)
    const bestCandidate = candidates.reduce((best, current) =>
      current.score < best.score ? current : best
    );

    // Determine action based on intersection ID
    let action: 'call_georgia_apis' | 'call_houston_apis' | 'no_action';

    if (bestCandidate.intersection.id === 'mlk_georgia') {
      action = 'call_georgia_apis';
    } else if (bestCandidate.intersection.id === 'houston') {
      action = 'call_houston_apis';
    } else {
      action = 'no_action';
    }

    return {
      intersectionId: bestCandidate.intersection.id,
      intersectionName: bestCandidate.intersection.name,
      distance: bestCandidate.distance,
      action
    };
  }

  /**
   * Execute the determined action
   */
  private static async executeAction(actionData: IntersectionAction): Promise<void> {
    const { intersectionId, intersectionName, distance, action } = actionData;

    // Check if we're already handling this intersection
    if (this.currentActiveIntersection === intersectionId) {
      return; // Already active for this intersection
    }

    // Stop any current API activity
    if (this.currentActiveIntersection && this.vehicleDisplayViewModel) {
      this.vehicleDisplayViewModel.stop();
      this.currentActiveIntersection = null;
    }

    switch (action) {
      case 'call_georgia_apis':
        console.log(`🎯 Selected: ${intersectionName} (${distance.toFixed(1)}m) - Starting Georgia APIs`);
        if (this.vehicleDisplayViewModel) {
          this.vehicleDisplayViewModel.start('georgia');
          this.currentActiveIntersection = intersectionId;
        }
        break;

      case 'call_houston_apis':
        console.log(`🎯 Selected: ${intersectionName} (${distance.toFixed(1)}m) - Starting Houston APIs`);
        if (this.vehicleDisplayViewModel) {
          this.vehicleDisplayViewModel.start('houston');
          this.currentActiveIntersection = intersectionId;
        }
        break;

      case 'no_action':
        console.log(`🎯 Near ${intersectionName} (${distance.toFixed(1)}m) - No action configured`);
        break;
    }
  }


  /**
   * Calculate heading difference between two angles
   */
  private static getHeadingDifference(heading1: number, heading2: number): number {
    let diff = Math.abs(heading1 - heading2);
    if (diff > 180) {
      diff = 360 - diff;
    }
    return diff;
  }

  /**
   * Get current monitoring status
   */
  public static get monitoringStatus(): string {
    return this.isMonitoring ? 'Monitoring intersection proximity for conditional API calls' : 'Stopped';
  }

  /**
   * Cleanup resources
   */
  public static cleanup(): void {
    this.stopConditionalApiCalling();
  }
}