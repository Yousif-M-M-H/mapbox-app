// app/src/core/api/config.ts
export const API_CONFIG = {
  // Mapbox access token (keep this the same)
  MAPBOX_ACCESS_TOKEN: 'pk.eyJ1IjoieW9zaWZtb2hhbWVkYWluIiwiYSI6ImNtODNsNzAwMDA2YjMyanBuamhxYzNucTYifQ.KoWrvWMmp4ZhrOXkVN640Q',
  
  // Old MongoDB endpoints
  SERVER_URL: 'http://10.0.2.2:5000',
  API_URL: 'http://10.0.2.2:5000/api',
  
  // New Redis endpoints
  REDIS_API_URL: 'http://10.199.1.11:9095',
  REDIS_SDSM_ENDPOINT: 'http://10.199.1.11:9095/latest/sdsm_events'
};