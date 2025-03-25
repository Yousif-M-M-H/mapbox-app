import MapboxGL from '@rnmapbox/maps';
import { API_CONFIG } from './config';

export const initMapbox = () => {
  MapboxGL.setAccessToken(API_CONFIG.MAPBOX_ACCESS_TOKEN);
  MapboxGL.setTelemetryEnabled(true);
};