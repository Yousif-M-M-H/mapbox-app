// app/src/features/UserHeading/services/IntersectionAnalyzer.ts

export interface Intersection {
  coordinates: [number, number];
  name: string;
}

export interface IntersectionAnalysis {
  approaching: string;
  closest: string;
  distanceToA: number;
  distanceToB: number;
  bearingToA: number;
  bearingToB: number;
  headingDiffA: number;
  headingDiffB: number;
}

export class IntersectionAnalyzer {
  private intersections: { A: Intersection; B: Intersection };
  
  constructor(intersectionA: Intersection, intersectionB: Intersection) {
    this.intersections = { A: intersectionA, B: intersectionB };
    console.log('🛣️ IntersectionAnalyzer initialized');
  }
  
  /**
   * Analyze which intersection user is approaching and which is closest
   */
  analyze(userLat: number, userLon: number, userHeading: number): IntersectionAnalysis {
    const analysis = this.calculateIntersectionAnalysis(userLat, userLon, userHeading);
    return analysis; // Return analysis without filtering logs here
  }
  
  /**
   * Calculate intersection analysis data
   */
  private calculateIntersectionAnalysis(userLat: number, userLon: number, userHeading: number): IntersectionAnalysis {
    // Calculate distances
    const distanceToA = this.calculateDistance(userLat, userLon, this.intersections.A.coordinates[1], this.intersections.A.coordinates[0]);
    const distanceToB = this.calculateDistance(userLat, userLon, this.intersections.B.coordinates[1], this.intersections.B.coordinates[0]);
    
    // Calculate bearings
    const bearingToA = this.calculateBearing(userLat, userLon, this.intersections.A.coordinates[1], this.intersections.A.coordinates[0]);
    const bearingToB = this.calculateBearing(userLat, userLon, this.intersections.B.coordinates[1], this.intersections.B.coordinates[0]);
    
    // Calculate heading differences
    const headingDiffA = this.getHeadingDifference(userHeading, bearingToA);
    const headingDiffB = this.getHeadingDifference(userHeading, bearingToB);
    
    // Determine approaching intersection
    const approaching = headingDiffA < headingDiffB ? this.intersections.A.name : this.intersections.B.name;
    
    // Determine closest intersection
    const distanceDifference = Math.abs(distanceToA - distanceToB);
    const closest = distanceDifference < 20 ? approaching : (distanceToA < distanceToB ? this.intersections.A.name : this.intersections.B.name);
    
    return {
      approaching,
      closest,
      distanceToA,
      distanceToB,
      bearingToA,
      bearingToB,
      headingDiffA,
      headingDiffB
    };
  }
  
  /**
   * Calculate distance between two GPS coordinates (in meters)
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }
  
  /**
   * Calculate bearing from one point to another (in degrees)
   */
  private calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    const θ = Math.atan2(y, x);
    return (θ * 180 / Math.PI + 360) % 360;
  }
  
  /**
   * Calculate angular difference between two headings
   */
  private getHeadingDifference(heading1: number, heading2: number): number {
    let diff = Math.abs(heading1 - heading2);
    return Math.min(diff, 360 - diff);
  }
}