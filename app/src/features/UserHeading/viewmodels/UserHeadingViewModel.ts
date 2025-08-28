// app/src/features/UserHeading/viewmodels/UserHeadingViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { HeadingData, HeadingConfig, HeadingDirection } from '../models/HeadingModels';
import { HeadingService } from '../services/HeadingService';
import { IntersectionAnalyzer, Intersection, IntersectionAnalysis } from '../services/IntersectionAnalyzer';

export class UserHeadingViewModel {
  // Observable state
  currentHeading: HeadingData | null = null;
  isTracking: boolean = false;
  error: string | null = null;
  
  // Private properties
  private headingService: HeadingService;
  private intersectionAnalyzer: IntersectionAnalyzer;
  private trackingInterval: NodeJS.Timeout | null = null;
  
  private readonly config: HeadingConfig = {
    enableCompass: true,
    enableMovementTracking: true,
    smoothingFactor: 0.8,
    updateInterval: 2000
  };
  
  // Define intersections
  private readonly intersections = {
    A: { coordinates: [-85.29210875681545, 35.03977808283658] as [number, number], name: 'Intersection A' },
    B: { coordinates: [-85.29093681299605, 35.04193103764534] as [number, number], name: 'Intersection B' }
  };
  
  constructor() {
    this.headingService = new HeadingService(this.config);
    this.intersectionAnalyzer = new IntersectionAnalyzer(this.intersections.A, this.intersections.B);
    makeAutoObservable(this);
    
  }
  
  /**
   * Analyze intersection approach for given location and heading
   */
  analyzeIntersectionApproach(userLat: number, userLon: number, userHeading: number): IntersectionAnalysis {
    return this.intersectionAnalyzer.analyze(userLat, userLon, userHeading);
  }
  
  /**
   * Get intersection coordinates for map display
   */
  get intersectionCoordinates() {
    return this.intersections;
  }
  
  /**
   * Start heading tracking
   */
  async startTracking(): Promise<void> {
    if (this.isTracking) {
      return;
    }
    
    try {
      
      runInAction(() => {
        this.isTracking = true;
        this.error = null;
      });
      
      
    } catch (error) {
      runInAction(() => {
        this.error = `Failed to start tracking: ${error}`;
        this.isTracking = false;
      });
    }
  }
  
  /**
   * Stop heading tracking
   */
  stopTracking(): void {
    if (!this.isTracking) {
      return;
    }
    
    
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
    
    runInAction(() => {
      this.isTracking = false;
    });
  }
  
  /**
   * Get magnetic heading in degrees
   */
  get magneticHeading(): number | null {
    return this.currentHeading?.magneticHeading || null;
  }
  
  /**
   * Get current compass direction as string
   */
  get compassDirection(): string {
    if (!this.currentHeading) {
      return 'Unknown';
    }
    
    return HeadingService.getCompassDirection(this.currentHeading.magneticHeading);
  }
  
  /**
   * Check if heading data is available
   */
  get hasHeading(): boolean {
    return this.currentHeading !== null;
  }
  
  /**
   * Get formatted heading string for display
   */
  get formattedHeading(): string {
    if (!this.currentHeading) {
      return 'No heading data';
    }
    
    const magnetic = this.currentHeading.magneticHeading.toFixed(0);
    const direction = this.compassDirection;
    
    return `${magnetic}° ${direction}`;
  }
  
  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopTracking();
  }
}