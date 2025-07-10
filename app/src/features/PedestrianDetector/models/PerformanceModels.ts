// app/src/features/PedestrianDetector/models/PerformanceModels.ts

export interface SimplePerformanceMetrics {
  totalRequestTime: number;        // Complete request cycle (ms)
  timeToFirstByte: number;         // Server response delay (ms)
  downloadTime: number;            // Response download time (ms)
  jsonParseTime: number;           // JSON parsing time (ms)
  responseSize: number;            // Response size in bytes
  timestamp: number;               // When measurement was taken
}