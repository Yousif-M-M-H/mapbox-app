// app/src/testingFeatures/laneShiftTest/viewmodels/LaneShiftTestViewModel.ts

import { makeAutoObservable, runInAction } from 'mobx';
import { ParsedLane, TestLaneData } from '../models/LaneModels';
import { MAPParserService } from '../services/MAPParserService';

export class LaneShiftTestViewModel {
  testData: TestLaneData = {
    selectedLane: null,
    intersectionId: 0,
    refPoint: [0, 0],
    testStatus: 'idle'
  };
  
  isTestEnabled: boolean = false;
  
  constructor() {
    makeAutoObservable(this);
  }
  
  // Getters
  get selectedLane(): ParsedLane | null {
    return this.testData.selectedLane;
  }
  
  get laneCoordinates(): [number, number][] {
    return this.selectedLane?.coordinates || [];
  }
  
  get hasValidLane(): boolean {
    return this.selectedLane !== null && this.laneCoordinates.length > 0;
  }
  
  /**
   * Initialize the test
   */
  initializeTest = (): void => {
    
    try {
      const parsedData = MAPParserService.parseTestLane();
      
      runInAction(() => {
        this.testData = parsedData;
      });
      
      if (parsedData.testStatus === 'success') {
      } else {
      }
      
    } catch (error) {
    }
  };
  
  /**
   * Toggle the line visibility
   */
  toggleTest = (): boolean => {
    this.isTestEnabled = !this.isTestEnabled;
    
    if (this.isTestEnabled) {
    }
    
    return this.isTestEnabled;
  };
  
  /**
   * Get the line as GeoJSON for map rendering
   */
  getLaneGeoJSON(): any | null {
    if (!this.hasValidLane || !this.selectedLane) {
      return null;
    }
    
    return MAPParserService.getLaneAsGeoJSON(this.selectedLane);
  }
  
  /**
   * Get center coordinates for camera
   */
  getCenterCoordinates(): [number, number] {
    if (!this.hasValidLane || this.laneCoordinates.length === 0) {
      return [0, 0];
    }
    
    // Calculate center of the two points
    const [lon1, lat1] = this.laneCoordinates[0];
    const [lon2, lat2] = this.laneCoordinates[1];
    
    const centerLon = (lon1 + lon2) / 2;
    const centerLat = (lat1 + lat2) / 2;
    
    return [centerLon, centerLat];
  }
  
  /**
   * Get simple info for display
   */
  getLaneInfo(): string {
    if (!this.hasValidLane) {
      return 'No line data';
    }
    
    return `Simple Line Test (${this.laneCoordinates.length} points)`;
  }
  
  cleanup(): void {
    runInAction(() => {
      this.isTestEnabled = false;
    });
  }
}