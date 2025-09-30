// app/src/testingFeatures/TestingConfig.ts
export const TESTING_CONFIG = {
  // Change this to true to enable testing mode with Detection Latency Test
  USE_TESTING_MODE: false,
  USE_VEHICLE_TESTING_FEATURE: false,

  // Toggle to show/hide the fixed testing pedestrian
  SHOW_FIXED_PEDESTRIAN: false,

  // Toggle to enable/disable SDSM API calls and display
  ENABLE_SDSM_API: true,

  // NEW: Toggle to hide SDSM data specifically for Houston intersection
  // When false, Houston intersection SDSM data will be hidden while Georgia remains visible
  SHOW_HOUSTON_SDSM: true,

  // Fixed pedestrian coordinates for testing [lat, lon]
  // Starting position (outside detection zone for proper latency testing)
  FIXED_PEDESTRIAN_COORDINATES: [35.04475484458253, -85.30557334560115] as [number, number],
  
  // Detection Latency Test Configuration
  DETECTION_LATENCY_TEST: {
    ENABLED: false,
    SIMULATION_INTERVAL_MS: 2000,  // Move pedestrian every 2 seconds
    MONITORING_INTERVAL_MS: 100,   // Check conditions every 100ms for precision
    RUN_ONCE: false,                // Only run test once per session
  }
} as const;