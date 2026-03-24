export const API_CONFIG = {

  // Set MAPBOX_ACCESS_TOKEN in your .env file or environment
  MAPBOX_ACCESS_TOKEN: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN || '',

  SERVER_URL: 'http://10.0.2.2:5000',
  API_URL: 'http://10.0.2.2:5000/api',
  
  REDIS_API_URL: 'http://roadaware.cuip.research.utc.edu/cv2x',
  REDIS_SDSM_ENDPOINT: 'http://roadaware.cuip.research.utc.edu/cv2x/latest/sdsm_events/MLK_Georgia',
  
  REDIS_MAP_ENDPOINT: 'http://10.199.1.11:9095/latest/map_events',

  // Dashboard backend (SPaT zones authored in Kepler dashboard)
  DASHBOARD_API_URL: 'http://10.0.2.2:3001'
};