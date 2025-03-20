import MapboxGL, { Logger } from "@rnmapbox/maps";

// Logger configuration
Logger.setLogCallback(log => {
  const { message } = log; 
  if (message.match(/request failed due to a permanent error: Canceled/i) || 
      message.match(/request failed due to a permanent error: Socket Closed/i)) {
    return true; 
  }
  return false; 
});

// Mapbox configuration
export const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoieW9zaWZtb2hhbWVkYWluIiwiYSI6ImNtODNsNzAwMDA2YjMyanBuamhxYzNucTYifQ.KoWrvWMmp4ZhrOXkVN640Q';

export const initMapbox = () => {
  MapboxGL.setAccessToken(MAPBOX_ACCESS_TOKEN);
  MapboxGL.setTelemetryEnabled(true);
};