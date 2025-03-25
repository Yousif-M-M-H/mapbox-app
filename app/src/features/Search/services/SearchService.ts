import { SearchResult } from '../models/Search';
import { Coordinate } from '../../Map/models/Location';
import { API_CONFIG } from '../../../core/api/config';

export class SearchService {
  static async searchAddress(
    query: string,
    userLocation?: Coordinate
  ): Promise<SearchResult[]> {
    try {
      if (!query.trim()) return [];
      
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`;
      
      const params = new URLSearchParams({
        access_token: API_CONFIG.MAPBOX_ACCESS_TOKEN,
        autocomplete: 'true',
        country: 'US',
        types: 'address,place,poi',
        limit: '10'
      });
      
      // If user location is provided, use proximity parameter to prioritize nearby results
      if (userLocation) {
        params.append('proximity', `${userLocation.longitude},${userLocation.latitude}`);
      }
      
      const response = await fetch(`${endpoint}?${params.toString()}`);
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature: any) => ({
          placeName: feature.place_name,
          coordinates: feature.center,
          relevance: feature.relevance,
          distance: userLocation ? SearchService.calculateDistance(
            userLocation.latitude, 
            userLocation.longitude,
            feature.center[1], 
            feature.center[0]
          ) : null
        }));
        
        // Sort results by distance if user location is available,
        // otherwise keep Mapbox's default relevance sorting
        return userLocation 
          ? results.sort((a: SearchResult, b: SearchResult) => (a.distance || 0) - (b.distance || 0))
          : results;
      }
      
      return [];
    } catch (error) {
      console.error('Error searching for address:', error);
      return [];
    }
  }

  // Calculate distance between two points using the Haversine formula
  private static calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}