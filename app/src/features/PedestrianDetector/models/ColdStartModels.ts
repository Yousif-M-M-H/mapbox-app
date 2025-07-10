// app/src/features/PedestrianDetector/models/ColdStartModels.ts

export interface ColdStartMetrics {
  totalColdStartTime: number;     // Complete first detection cycle (ms)
  apiCallTime: number;            // First SDSM API request (ms)
  processingTime: number;         // First data processing (ms)
  stateUpdateTime: number;        // First state update (ms)
  timestamp: number;              // When measurement was taken
  pedestrianCount: number;        // Pedestrians found in first cycle
  success: boolean;               // Whether first cycle completed successfully
}