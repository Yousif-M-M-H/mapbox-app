// app/src/features/DriverView/models/DriverViewModel.ts
import { makeAutoObservable } from 'mobx';

export class DriverViewModel {
  isDriverPerspective: boolean = false;
  
  constructor(
    private getUserLocationCoordinate: () => [number, number],
    private getUserHeading: () => number
  ) {
    makeAutoObservable(this);
  }
  
  // Toggle driver perspective
  toggleDriverPerspective(): boolean {
    this.isDriverPerspective = !this.isDriverPerspective;
    return this.isDriverPerspective;
  }

  // Enable driver perspective
  enableDriverPerspective() {
    this.isDriverPerspective = true;
  }

  // Disable driver perspective
  disableDriverPerspective() {
    this.isDriverPerspective = false;
  }
  
  // Get camera parameters based on current mode (driver or normal)
  getCameraParameters() {
    if (this.isDriverPerspective) {
      return {
        centerCoordinate: this.getUserLocationCoordinate(),
        zoomLevel: 19,
        pitch: 60, // High pitch for driver perspective
        heading: this.getUserHeading(), // Align with vehicle heading
        animationDuration: 500
      };
    } else {
      return {
        centerCoordinate: this.getUserLocationCoordinate(),
        zoomLevel: 18,
        pitch: 0, // Normal overhead view
        animationDuration: 500
      };
    }
  }
}