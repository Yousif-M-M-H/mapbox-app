// src/features/Navigation/viewmodels/NavigationViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { RouteStep, RouteModel } from '../../Route/models/Route';
import { NavigationService } from '../services/NavigationService';
import { formatDistance, formatDuration } from '../../../core/utils/formatters';

export class NavigationViewModel {
  isNavigating: boolean = false;
  navigationSteps: RouteStep[] = [];
  currentStep: RouteStep | null = null;
  currentStepIndex: number = 0;
  distanceToNextStep: number = 0;
  isApproachingStep: boolean = false;
  remainingDistance: number | null = null;
  remainingDuration: number | null = null;
  
  private locationSubscription: Location.LocationSubscription | null = null;
  private rerouteCount: number = 0;
  
  constructor(
    private userLocationProvider: () => [number, number],
    private destinationProvider: () => [number, number] | null,
    private routeGeometryProvider: () => [number, number][],
    private onRerouteNeeded: () => void
  ) {
    makeAutoObservable(this);
  }
  
  updateWithRoute(route: RouteModel) {
    if (!route) return;
    
    console.log("NavigationViewModel: Updating with route, steps:", 
      route.steps ? route.steps.length : 0);
    
    runInAction(() => {
      this.navigationSteps = route.steps || [];
      if (this.navigationSteps.length > 0) {
        this.currentStep = this.navigationSteps[0];
        this.currentStepIndex = 0;
      }
      
      // Update initial distance/duration estimates
      this.remainingDistance = route.distance || null;
      this.remainingDuration = route.duration || null;
    });
  }
  
  startNavigation() {
    const destination = this.destinationProvider();
    if (!destination) {
      Alert.alert('Navigation Error', 'Please select a destination first');
      return;
    }
    
    console.log("NavigationViewModel: Starting navigation with steps:", this.navigationSteps.length);
    
    if (this.navigationSteps.length === 0) {
      // If we don't have steps, still allow basic navigation
      Alert.alert('Limited Navigation', 'Turn-by-turn directions not available, but basic navigation is enabled');
    }
    
    // Set navigation mode
    runInAction(() => {
      this.isNavigating = true;
      this.currentStepIndex = 0;
      if (this.navigationSteps.length > 0) {
        this.currentStep = this.navigationSteps[0];
      }
    });
    
    // Start location tracking
    this.startLocationTracking();
  }
  
  stopNavigation() {
    console.log("NavigationViewModel: Stopping navigation");
    runInAction(() => {
      this.isNavigating = false;
    });
    
    this.stopLocationTracking();
  }
  
  private startLocationTracking() {
    // Stop any existing subscription
    this.stopLocationTracking();
    
    console.log("NavigationViewModel: Starting location tracking");
    
    // Start watching position at a reasonable frequency
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 10,  // Update every 10 meters of movement
        timeInterval: 3000    // Or at most every 3 seconds
      },
      (location) => {
        this.updateNavigationState(location);
      }
    ).then(subscription => {
      this.locationSubscription = subscription;
    }).catch(error => {
      console.error('Error starting location tracking:', error);
      Alert.alert('Navigation Error', 'Could not track your location');
      this.stopNavigation();
    });
  }
  
  private stopLocationTracking() {
    if (this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }
  
  private updateNavigationState(location: Location.LocationObject) {
    if (!this.isNavigating) return;

    const destination = this.destinationProvider();
    if (!destination) return;
    
    const userCoordinate: [number, number] = [
      location.coords.longitude,
      location.coords.latitude
    ];
    
    // Check if we've reached the destination
    if (NavigationService.hasReachedDestination(
      userCoordinate,
      destination
    )) {
      runInAction(() => {
        this.isNavigating = false;
        Alert.alert('Arrived', 'You have reached your destination!');
      });
      this.stopLocationTracking();
      return;
    }
    
    // Check if we need to reroute
    if (NavigationService.isRerouteNeeded(
      userCoordinate,
      this.routeGeometryProvider()
    )) {
      this.rerouteCount++;
      
      // Don't reroute too frequently
      if (this.rerouteCount % 3 === 0) {
        console.log("NavigationViewModel: Reroute needed");
        this.onRerouteNeeded();
      }
    }
    
    // Update current navigation step
    if (this.navigationSteps.length > 0) {
      const stepInfo = NavigationService.getCurrentStep(
        this.navigationSteps,
        userCoordinate,
        this.navigationSteps.length - this.currentStepIndex
      );
      
      if (stepInfo) {
        runInAction(() => {
          this.currentStep = stepInfo.step;
          this.currentStepIndex = stepInfo.index;
          this.distanceToNextStep = stepInfo.distanceToStep;
          this.isApproachingStep = stepInfo.isApproaching;

          // Update remaining distance and duration
          this.updateRemainingInfo();
        });
      }
    }
  }
  
  private updateRemainingInfo() {
    // Calculate remaining distance
    if (this.navigationSteps.length > 0) {
      let remainingDistance = 0;
      let remainingDuration = 0;
      
      // Sum up remaining steps
      for (let i = this.currentStepIndex; i < this.navigationSteps.length; i++) {
        if (this.navigationSteps[i]) {
          remainingDistance += this.navigationSteps[i].distance;
          remainingDuration += this.navigationSteps[i].duration;
        }
      }
      
      // Adjust for progress in current step
      if (this.currentStep && this.currentStep.distance > 0) {
        const stepProgress = Math.max(0, Math.min(1, 1 - (this.distanceToNextStep / this.currentStep.distance)));
        remainingDistance -= this.currentStep.distance * stepProgress;
        remainingDuration -= this.currentStep.duration * stepProgress;
      }
      
      runInAction(() => {
        this.remainingDistance = Math.max(0, remainingDistance);
        this.remainingDuration = Math.max(0, remainingDuration);
      });
    }
  }
  
  // Cleanup resources
  cleanup() {
    this.stopLocationTracking();
  }
  
  // Debug method to help troubleshoot
  debugNavigationState() {
    console.log("Debug: isNavigating =", this.isNavigating);
    console.log("Debug: navigationSteps =", this.navigationSteps.length);
    console.log("Debug: currentStepIndex =", this.currentStepIndex);
    console.log("Debug: currentStep =", this.currentStep?.instructions);
    console.log("Debug: distanceToNextStep =", this.distanceToNextStep);
  }
  
  // Format distance to next maneuver
  get formattedStepDistance(): string {
    if (!this.isNavigating || !this.currentStep) return '';
    return formatDistance(this.distanceToNextStep);
  }
  
  // Format remaining distance
  get formattedRemainingDistance(): string {
    if (this.remainingDistance === null) return 'Unknown';
    return formatDistance(this.remainingDistance);
  }
  
  // Format remaining duration
  get formattedRemainingDuration(): string {
    if (this.remainingDuration === null) return 'Unknown';
    return formatDuration(this.remainingDuration);
  }
}