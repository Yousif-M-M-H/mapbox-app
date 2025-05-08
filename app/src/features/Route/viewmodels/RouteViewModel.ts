// src/features/Route/viewmodels/RouteViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { Alert } from 'react-native';
import { LineStringFeature, RouteModel, createRouteFeature } from '../models/Route';
import { DirectionsService } from '../services/DirectionsService';
import { formatDistance, formatDuration } from '../../../core/utils/formatters';

export class RouteViewModel {
  routeGeometry: LineStringFeature = createRouteFeature([]);
  showRoute: boolean = false;
  loading: boolean = false;
  distance: number | null = null;
  duration: number | null = null;
  lastRoute: RouteModel | null = null; // Store the last calculated route
  
  constructor(
    private userLocationProvider: () => [number, number],
    private destinationProvider: () => [number, number] | null
  ) {
    makeAutoObservable(this);
  }

  // Public getter for destination coordinates that the MapView can access
  get destination(): [number, number] | null {
    return this.destinationProvider ? this.destinationProvider() : null;
  }

  async calculateRoute() {
    const destination = this.destinationProvider();
    if (!destination) {
      console.log("No destination provided, clearing route");
      this.clearRoute();
      return;
    }
    
    console.log("Calculating route to destination");
    this.loading = true;
    try {
      const userGeoJSON = this.userLocationProvider();
      const destGeoJSON = destination;
      
      // First try to get the route from Mapbox
      let route = await DirectionsService.fetchDirections(userGeoJSON, destGeoJSON);
      
      // If route is null, try again with a simplified approach
      if (!route) {
        console.log("Falling back to simplified route");
        route = DirectionsService.generateSimplifiedRoute(userGeoJSON, destGeoJSON);
      }
      
      // Check that we have a valid route with coordinates
      if (route && route.coordinates && route.coordinates.length > 0) {
        runInAction(() => {
          this.routeGeometry = createRouteFeature(route.coordinates);
          this.showRoute = true; // CRITICAL: Make sure this is set to true
          this.distance = route.distance || null;
          this.duration = route.duration || null;
          this.lastRoute = route;
          
          console.log("Route calculated successfully, coordinates:", route.coordinates.length);
        });
      } else {
        throw new Error('Invalid route data received');
      }
    } catch (error) {
      console.error('Error in calculateRoute:', error);
      Alert.alert('Error', 'Unable to fetch route directions. Using a simplified route instead.');
      this.generateSimplifiedRoute();
    } finally {
      runInAction(() => {
        this.loading = false;
      });
    }
  }

  generateSimplifiedRoute() {
    const destination = this.destinationProvider();
    if (!destination) return;
    
    try {
      const userGeoJSON = this.userLocationProvider();
      const destGeoJSON = destination;
      
      const route = DirectionsService.generateSimplifiedRoute(userGeoJSON, destGeoJSON);
      
      runInAction(() => {
        this.routeGeometry = createRouteFeature(route.coordinates);
        this.showRoute = true; // CRITICAL: Make sure this is set to true
        this.distance = route.distance || null;
        this.duration = route.duration || null;
        this.lastRoute = route;
      });
    } catch (error) {
      console.error('Error generating simplified route:', error);
      
      // Last resort - create a simple direct line
      const start = this.userLocationProvider();
      const end = destination;
      
      const simpleRoute = {
        coordinates: [start, end],
        distance: 0,
        duration: 0
      };
      
      runInAction(() => {
        this.routeGeometry = createRouteFeature(simpleRoute.coordinates);
        this.showRoute = true; // CRITICAL: Make sure this is set to true
        this.distance = null;
        this.duration = null;
        this.lastRoute = simpleRoute;
      });
    }
  }
  
  clearRoute() {
    console.log("Clearing route");
    runInAction(() => {
      this.routeGeometry = createRouteFeature([]);
      this.showRoute = false;
      this.distance = null;
      this.duration = null;
      this.lastRoute = null;
    });
  }
  
  // Add debugShowRoute method to help troubleshoot
  debugShowRoute() {
    console.log("Debug: showRoute =", this.showRoute);
    console.log("Debug: routeGeometry length =", 
      this.routeGeometry.geometry.coordinates.length);
    console.log("Debug: distance =", this.distance);
    console.log("Debug: duration =", this.duration);
  }
  
  get formattedDistance(): string {
    if (this.distance === null) return 'Unknown';
    return formatDistance(this.distance);
  }

  get formattedDuration(): string {
    if (this.duration === null) return 'Unknown';
    return formatDuration(this.duration);
  }

  // Expose routeSteps for the NavigationViewModel
  get routeSteps() {
    return this.lastRoute?.steps || [];
  }
}