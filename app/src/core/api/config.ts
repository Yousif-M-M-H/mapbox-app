// app/src/core/api/config.ts
export const API_CONFIG = {
  // Mapbox for map rendering
  MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoieW9zaWZtb2hhbWVkYWluIiwiYSI6ImNtODNsNzAwMDA2YjMyanBuamhxYzNucTYifQ.KoWrvWMmp4ZhrOXkVN640Q',
  
  // Your local server (if you have one)
  SERVER_URL: 'http://10.0.2.2:5000',
  API_URL: 'http://10.0.2.2:5000/api',
  
  // MAIN V2X APIs
  REDIS_API_URL: 'http://roadaware.cuip.research.utc.edu/cv2x',
  
  // SDSM (Vehicle/Pedestrian data) endpoints
  REDIS_SDSM_ENDPOINT_GEORGIA: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events/MLK_Georgia',
  REDIS_SDSM_ENDPOINT_HOUSTON: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events/MLK_Houston',
  
  // SPaT (Signal Phase and Timing) endpoints
  REDIS_SPAT_ENDPOINT_GEORGIA: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Georgia',
  REDIS_SPAT_ENDPOINT_HOUSTON: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/mlk_spat_events/MLK_Houston',
  
  // Map data endpoint
  REDIS_MAP_ENDPOINT: 'http://10.199.1.11:9095/latest/map_events',
  
  // REFRESH RATES (in milliseconds)
  SDSM_REFRESH_RATE: 100,    // 10Hz - Vehicle/pedestrian data
  SPAT_REFRESH_RATE: 1000,   // 1Hz - Signal timing data  
  MAP_REFRESH_RATE: 5000,    // 0.2Hz - Map data (rarely changes)
  
  // Request timeouts
  SDSM_TIMEOUT: 80,          // Must be less than refresh rate
  SPAT_TIMEOUT: 1000,
  MAP_TIMEOUT: 3000
};