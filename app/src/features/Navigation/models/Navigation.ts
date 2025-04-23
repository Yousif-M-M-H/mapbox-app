import { RouteStep } from '../../Route/models/Route';

export interface NavigationState {
  isNavigating: boolean;
  currentStep: RouteStep | null;
  currentStepIndex: number;
  distanceToNextStep: number;
  isApproachingStep: boolean;
  remainingDistance: number | null;
  remainingDuration: number | null;
}




