// app/src/testingFeatures/TestingConfig.ts
export const TESTING_CONFIG = {
  // Change this to true to enable testing mode with Detection Latency Test
  USE_TESTING_MODE: true,
  USE_VEHICLE_TESTING_FEATURE: false,
  
  // Fixed pedestrian coordinates for testing [lat, lon]
  // Starting position (outside detection zone for proper latency testing)
  FIXED_PEDESTRIAN_COORDINATES: [35.04574821897141, -85.30823649580637] as [number, number],
  
  // Detection Latency Test Configuration
  DETECTION_LATENCY_TEST: {
    ENABLED: false,
    SIMULATION_INTERVAL_MS: 2000,  // Move pedestrian every 2 seconds
    MONITORING_INTERVAL_MS: 100,   // Check conditions every 100ms for precision
    RUN_ONCE: false,                // Only run test once per session
  }
} as const;