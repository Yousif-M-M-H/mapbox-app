import { RouteModel, RouteStep } from '../models/Route';
import { API_CONFIG } from '../../../core/api/config';

export class DirectionsService {
  static async fetchDirections(
    start: [number, number], 
    end: [number, number]
  ): Promise<RouteModel | null> {
    try {
      // Format coordinates for Mapbox API
      const startCoord = `${start[0]},${start[1]}`;
      const endCoord = `${end[0]},${end[1]}`;
      
      // Add parameters for turn-by-turn navigation
      const params = new URLSearchParams({
        access_token: API_CONFIG.MAPBOX_ACCESS_TOKEN,
        geometries: 'geojson',
        overview: 'full',
        steps: 'true',
        annotations: 'duration,distance,speed',
        voice_instructions: 'true',
        banner_instructions: 'true',
        alternatives: 'false',
        continue_straight: 'true',
        language: 'en'
      });
      
      // Construct the Mapbox Directions API URL
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoord};${endCoord}?${params.toString()}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.code === 'NoRoute' || !data.routes || data.routes.length === 0) {
        console.warn('No route found between the specified points');
        return null;
      }
      
      const route = data.routes[0];
      const steps = route.legs[0].steps.map((step: any) => ({
        instructions: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration,
        maneuver: {
          type: step.maneuver.type,
          modifier: step.maneuver.modifier,
          location: step.maneuver.location
        }
      }));
      
      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance,
        duration: route.duration,
        steps: steps
      };
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  }

  static generateSimplifiedRoute(
    start: [number, number], 
    end: [number, number]
  ): RouteModel {
    try {
      const startLon = start[0];
      const startLat = start[1];
      const endLon = end[0];
      const endLat = end[1];
      
      // Create some intermediate points to make the route look more realistic
      const midPoint1: [number, number] = [
        startLon + (endLon - startLon) * 0.33,
        startLat + (endLat - startLat) * 0.33
      ];
      
      const midPoint2: [number, number] = [
        startLon + (endLon - startLon) * 0.66,
        startLat + (endLat - startLat) * 0.66
      ];
      
      // Calculate straight-line distance (rough approximation)
      const distance = this.calculateDirectDistance(startLat, startLon, endLat, endLon);
      
      return {
        coordinates: [
          start,
          midPoint1,
          midPoint2,
          end
        ],
        distance,
        duration: distance / 10 // assuming 10 m/s average speed (36 km/h)
      };
    } catch (error) {
      console.error('Error generating simplified route:', error);
      
      // Ultra simplified fallback
      return {
        coordinates: [start, end],
        distance: this.calculateDirectDistance(start[1], start[0], end[1], end[0]),
        duration: 0
      };
    }
  }
  
  // Calculate distance in meters
  static calculateDirectDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c;
  }
  
  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}