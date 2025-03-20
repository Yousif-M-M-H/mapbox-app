import { Alert } from 'react-native';
import { MAPBOX_ACCESS_TOKEN } from '../utils/mapboxConfig';
import { RouteModel } from '../models/Routes';


export class DirectionsService {
  static async fetchDirections(
    start: [number, number], 
    end: [number, number]
  ): Promise<RouteModel | null> {
    try {
      // Format coordinates for Mapbox API
      const startCoord = `${start[0]},${start[1]}`;
      const endCoord = `${end[0]},${end[1]}`;
      
      // Add new options for better route handling
      const params = new URLSearchParams({
        access_token: MAPBOX_ACCESS_TOKEN,
        geometries: 'geojson',
        overview: 'full', // Get full route path
        steps: 'true',    // Include step information for better visualization
        alternatives: 'false',
        continue_straight: 'true',
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
      return {
        coordinates: route.geometry.coordinates,
        distance: route.distance, // in meters
        duration: route.duration  // in seconds
      };
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  }

  // Improved simplified route generation for long distances
  static generateSimplifiedRoute(
    start: [number, number], 
    end: [number, number]
  ): RouteModel {
    try {
      const startLon = start[0];
      const startLat = start[1];
      const endLon = end[0];
      const endLat = end[1];
      
      // Calculate the distance to determine how many intermediate points to create
      const directDistance = this.calculateDirectDistance(startLat, startLon, endLat, endLon);
      const numberOfPoints = Math.max(Math.ceil(directDistance / 50000) * 2, 4);
      
      // Create more intermediate points for longer routes
      const intermediatePoints: [number, number][] = [];
      
      for (let i = 1; i < numberOfPoints - 1; i++) {
        const fraction = i / (numberOfPoints - 1);
        // Add some randomness to make the route look more natural
        const jitterLon = (Math.random() - 0.5) * 0.05 * directDistance / 200000;
        const jitterLat = (Math.random() - 0.5) * 0.05 * directDistance / 200000;
        
        intermediatePoints.push([
          startLon + (endLon - startLon) * fraction + jitterLon,
          startLat + (endLat - startLat) * fraction + jitterLat
        ]);
      }
      
      // Create the full route with start, intermediate points, and end
      const coordinates = [start, ...intermediatePoints, end];
      
      return {
        coordinates,
        distance: directDistance,
        duration: directDistance / 12 // Assuming 12 m/s average speed (~43 km/h)
      };
    } catch (error) {
      console.error('Error generating simplified route:', error);
      // Fallback to a very simple direct line
      return {
        coordinates: [start, end],
        distance: this.calculateDirectDistance(start[1], start[0], end[1], end[0]),
        duration: 0
      };
    }
  }
  
  // Calculate direct distance in meters
  private static calculateDirectDistance(
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