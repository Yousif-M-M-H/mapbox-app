import { RouteStep } from '../../Route/models/Route';

export class NavigationService {
  private static readonly ARRIVAL_THRESHOLD = 20; // meters
  private static readonly REROUTE_THRESHOLD = 50; // meters
  private static readonly NEXT_STEP_THRESHOLD = 30; // meters
  
  // Find the current step based on user location
  static getCurrentStep(
    steps: RouteStep[], 
    userLocation: [number, number],
    remainingSteps: number = steps.length
  ): {step: RouteStep, index: number, distanceToStep: number, isApproaching: boolean} | null {
    if (!steps || steps.length === 0 || remainingSteps === 0) {
      return null;
    }
    
    // Get the next step from the remaining steps
    const currentStepIndex = steps.length - remainingSteps;
    const currentStep = steps[currentStepIndex];
    
    // Calculate distance to the maneuver point
    const distanceToStep = this.calculateDistance(
      userLocation[1],
      userLocation[0],
      currentStep.maneuver.location[1],
      currentStep.maneuver.location[0]
    );
    
    // Determine if we're approaching the maneuver
    const isApproaching = distanceToStep < 150; // Within 150 meters of the turn
    
    // If we're close enough to the current step, move to the next one
    if (distanceToStep < this.NEXT_STEP_THRESHOLD && remainingSteps > 1) {
      return this.getCurrentStep(steps, userLocation, remainingSteps - 1);
    }
    
    return {
      step: currentStep,
      index: currentStepIndex,
      distanceToStep,
      isApproaching
    };
  }
  
  // Check if the user has reached the destination
  static hasReachedDestination(
    userLocation: [number, number], 
    destination: [number, number]
  ): boolean {
    const distance = this.calculateDistance(
      userLocation[1],
      userLocation[0],
      destination[1],
      destination[0]
    );
    
    return distance < this.ARRIVAL_THRESHOLD;
  }
  
  // Check if a reroute is needed based on user's deviation from the route
  static isRerouteNeeded(
    userLocation: [number, number],
    routeCoordinates: [number, number][]
  ): boolean {
    if (!routeCoordinates || routeCoordinates.length === 0) {
      return false;
    }
    
    // Find the closest point on the route
    let minDistance = Number.MAX_VALUE;
    
    for (const point of routeCoordinates) {
      const distance = this.calculateDistance(
        userLocation[1],
        userLocation[0],
        point[1],
        point[0]
      );
      
      minDistance = Math.min(minDistance, distance);
      
      
      if (minDistance < 5) {
        break;
      }
    }
    
    return minDistance > this.REROUTE_THRESHOLD;
  }
  
  // Calculate distance between two points using the Haversine formula
  static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}