// app/src/Main/viewmodels/MainViewModel.ts
import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { Coordinate } from '../../features/Map/models/Location';
import { MapViewModel } from '../../features/Map/viewmodels/MapViewModel';
import { SearchViewModel } from '../../features/Search/viewmodels/SearchViewModel';
import { RouteViewModel } from '../../features/Route/viewmodels/RouteViewModel';
import { NavigationViewModel } from '../../features/Navigation/viewmodels/NavigationViewModel';
import { SDSMViewModel } from '../../features/SDSM/viewmodels/SDSMViewModel';
import { LanesViewModel } from "../../features/lanes/viewmodels/LanesViewModel";
import { SearchResult } from '../../features/Search/models/Search';
import { RouteModel } from '../../features/Route/models/Route';

export class MainViewModel {
  mapViewModel: MapViewModel;
  searchViewModel: SearchViewModel;
  routeViewModel: RouteViewModel;
  navigationViewModel: NavigationViewModel;
  sdsmViewModel: SDSMViewModel;
  lanesViewModel: LanesViewModel;
  
  constructor() {
    // Create the MapViewModel first
    this.mapViewModel = new MapViewModel();
    
    // Create the SearchViewModel with a function to provide user location
    this.searchViewModel = new SearchViewModel(
      () => this.mapViewModel.userLocation
    );
    
    // Create the RouteViewModel with necessary provider functions
    this.routeViewModel = new RouteViewModel(
      () => this.mapViewModel.userLocationCoordinate,
      () => this.searchViewModel.destinationCoordinates,
      (route) => this.handleRouteCalculated(route)
    );
    
    // Create the NavigationViewModel with necessary provider functions
    this.navigationViewModel = new NavigationViewModel(
      () => this.mapViewModel.userLocationCoordinate,
      () => this.searchViewModel.destinationCoordinates,
      () => this.routeViewModel.routeGeometry.geometry.coordinates,
      () => this.recalculateRoute()
    );
    
    // Create the SDSMViewModel
    this.sdsmViewModel = new SDSMViewModel();
    
    // Create the LanesViewModel
    this.lanesViewModel = new LanesViewModel();
    
    makeAutoObservable(this);
    
    // Set up critical reactions for coordination
    this.setupReactions();
  }
  
  // Set up reactions to coordinate between ViewModels
  private setupReactions() {
    // When destination changes, calculate a new route
    reaction(
      () => this.searchViewModel.selectedDestination,
      (destination) => {
        console.log("Destination changed, calculating route...");
        if (destination) {
          this.routeViewModel.calculateRoute();
        } else {
          this.routeViewModel.clearRoute();
        }
      }
    );
  }
  
  // Handle when a new route is calculated
  private handleRouteCalculated(route: RouteModel): void {
    console.log("Route calculated, updating navigation...");
    if (route && route.steps) {
      this.navigationViewModel.updateWithRoute(route);
    }
  }
  
  // Recalculate the route (used during navigation for rerouting)
  private recalculateRoute() {
    console.log("Recalculating route...");
    this.routeViewModel.calculateRoute();
  }
  
  get isInitialized(): boolean {
    return this.mapViewModel.isInitialized || false;
  }
  
  get loading(): boolean {
    return this.mapViewModel.loading || 
           this.routeViewModel.loading;
  }
  
  get userLocation(): Coordinate {
    return this.mapViewModel.userLocation;
  }
  
  get userLocationCoordinate(): [number, number] {
    return this.mapViewModel.userLocationCoordinate;
  }
  
  get destinationLocationCoordinate(): [number, number] | null {
    return this.searchViewModel.destinationCoordinates;
  }
  
  get isNavigating(): boolean {
    return this.navigationViewModel.isNavigating;
  }
  
  get destinationTitle(): string {
    return this.searchViewModel.hasSelectedDestination 
      ? `Route to ${this.searchViewModel.destinationName}`
      : 'Enter a destination to see route';
  }
  
  async refreshLocation() {
    try {
      await this.mapViewModel.getCurrentLocation();
      if (this.searchViewModel.hasSelectedDestination) {
        this.routeViewModel.calculateRoute();
      }
      return this.mapViewModel.userLocation;
    } catch (error) {
      console.error('Failed to refresh location:', error);
      return null;
    }
  }
  
  setSearchQuery(query: string) {
    this.searchViewModel.setSearchQuery(query);
  }
  
  selectDestination(result: SearchResult) {
    console.log("Selecting destination:", result.placeName);
    this.searchViewModel.selectDestination(result);
    // We explicitly calculate the route here as well as in the reaction
    // to ensure it always happens
    this.routeViewModel.calculateRoute();
  }
  
  startNavigation() {
    console.log("Starting navigation...");
    if (!this.searchViewModel.hasSelectedDestination) return;
    this.navigationViewModel.startNavigation();
  }
  
  stopNavigation() {
    console.log("Stopping navigation...");
    this.navigationViewModel.stopNavigation();
  }
  
  cleanup() {
    this.navigationViewModel.cleanup();
    this.sdsmViewModel.cleanup();
    this.lanesViewModel.cleanup();
  }
}