// app/src/features/PedestrianDetector/models/ProcessingModels.ts

export interface ProcessingLatencyMetrics {
  jsonParsingTime: number;        // JSON.parse() duration (ms)
  dataExtractionTime: number;     // VRU filtering duration (ms)
  crosswalkDetectionTime: number; // Point-in-polygon calculation (ms)
  proximityDetectionTime: number; // Distance calculation (ms)
  totalProcessingTime: number;    // Sum of all processing times (ms)
  timestamp: number;              // When measurement was taken
  pedestrianCount: number;        // Number of pedestrians processed
}