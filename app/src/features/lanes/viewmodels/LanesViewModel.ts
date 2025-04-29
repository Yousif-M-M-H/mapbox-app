import { makeAutoObservable, runInAction } from 'mobx';
import { Lane, LanesResponse } from '../models/Lane';
import { LanesService } from '../services/LanesService';

export class LanesViewModel {
  lanes: Lane[] = [];
  loading: boolean = false;
  error: string | null = null;
  lastUpdated: Date | null = null;

  constructor() {
    makeAutoObservable(this);
    // We don't auto-fetch on construction, we'll let the component control this
  }

  /**
   * Fetch lane data from the API
   */
  async fetchLanesData() {
    this.loading = true;
    this.error = null;
    
    try {
      const response = await LanesService.fetchLanesData();
      
      runInAction(() => {
        if (response.success) {
          this.lanes = this.processLaneData(response.data);
          this.lastUpdated = new Date();
          
          if (this.lanes.length > 0) {
            console.log(`Updated with ${this.lanes.length} lanes`);
          }
        } else {
          this.error = 'Failed to fetch lane data';
          console.error('Lane data fetch error:', this.error);
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error instanceof Error ? error.message : 'Unknown error';
        console.error('Lane data fetch exception:', this.error);
        this.loading = false;
      });
    }
  }

  /**
   * Process lane data to ensure coordinates are valid
   */
  private processLaneData(lanes: Lane[]): Lane[] {
    return lanes.filter(lane => {
      if (!lane.location || !Array.isArray(lane.location.coordinates) || lane.location.coordinates.length < 2) {
        console.warn(`Lane ${lane.laneId} has invalid location data`);
        return false;
      }
      
      for (const coord of lane.location.coordinates) {
        if (!Array.isArray(coord) || coord.length !== 2) {
          console.warn(`Lane ${lane.laneId} has invalid coordinate format`);
          return false;
        }
        
        const [longitude, latitude] = coord;
        
        // Check if coordinates are numbers and within valid ranges
        if (isNaN(longitude) || isNaN(latitude) || 
            Math.abs(longitude) > 180 || Math.abs(latitude) > 90) {
          console.warn(`Lane ${lane.laneId} has invalid coordinates: [${longitude}, ${latitude}]`);
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Clean up resources when component unmounts
   */
  cleanup() {
    console.log('Lanes view model cleaned up');
  }
}