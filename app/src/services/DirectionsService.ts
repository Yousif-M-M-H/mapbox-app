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
      
      // Construct the Mapbox Directions API URL
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startCoord};${endCoord}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_ACCESS_TOKEN}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          coordinates: route.geometry.coordinates,
          distance: route.distance, // in meters
          duration: route.duration  // in seconds
        };
      }
      
      throw new Error('No routes found');
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  }

  static generateSimplifiedRoute(
    start: [number, number], 
    end: [number, number]
  ): RouteModel {
    const startLon = start[0];
    const startLat = start[1];
    const endLon = end[0];
    const endLat = end[1];
    
    // Create intermediate points
    const midPoint1: [number, number] = [
      startLon + (endLon - startLon) * 0.33,
      startLat + (endLat - startLat) * 0.33
    ];
    
    const midPoint2: [number, number] = [
      startLon + (endLon - startLon) * 0.66,
      startLat + (endLat - startLat) * 0.66
    ];
    
    // Estimate distance and duration (very rough estimation)
    const dx = endLon - startLon;
    const dy = endLat - startLat;
    const distanceApprox = Math.sqrt(dx * dx + dy * dy) * 111000; // rough conversion to meters
    
    return {
      coordinates: [
        start,
        midPoint1,
        midPoint2,
        end
      ],
      distance: distanceApprox,
      duration: distanceApprox / 10 // assuming 10 m/s average speed (36 km/h)
    };
  }
}