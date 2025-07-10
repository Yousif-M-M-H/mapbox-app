// app/src/features/PedestrianDetector/models/NetworkConditionModels.ts

export interface NetworkConditionMetrics {
  coldStartTotalTime: number;     // Complete first detection cycle (ms)
  apiCallTime: number;            // Network request duration (ms)
  success: boolean;               // Whether API call succeeded
  errorType?: string;             // Type of error if failed
  errorMessage?: string;          // Error details if failed
  retryAttempts: number;          // Number of retry attempts made
  timeoutOccurred: boolean;       // Whether request timed out
  timestamp: number;              // When measurement was taken
  pedestrianCount: number;        // Pedestrians found (if successful)
}

export interface NetworkErrorHandlingResult {
  timeoutBehavior: string;        // How app handles timeouts
  retryBehavior: string;          // How app handles retries
  failureBehavior: string;        // How app handles complete failures
  gracefulDegradation: boolean;   // Whether app continues to function
}