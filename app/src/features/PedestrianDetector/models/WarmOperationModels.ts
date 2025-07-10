// app/src/features/PedestrianDetector/models/WarmOperationModels.ts

export interface WarmOperationMetrics {
  cycleNumber: number;            // Which detection cycle (1, 2, 3, etc.)
  totalCycleTime: number;         // Complete detection cycle time (ms)
  apiCallTime: number;            // SDSM API request time (ms)
  processingTime: number;         // Data processing time (ms)
  stateUpdateTime: number;        // State update time (ms)
  timestamp: number;              // When measurement was taken
  pedestrianCount: number;        // Pedestrians found in this cycle
  success: boolean;               // Whether cycle completed successfully
}

export interface WarmOperationSummary {
  totalCycles: number;            // Number of warm cycles measured
  averageCycleTime: number;       // Average cycle time across all warm operations
  fastestCycle: number;           // Fastest warm cycle time
  slowestCycle: number;           // Slowest warm cycle time
  averageApiTime: number;         // Average API call time
  averageProcessingTime: number;  // Average processing time
  averageStateUpdateTime: number; // Average state update time
  successRate: number;            // Percentage of successful cycles
}