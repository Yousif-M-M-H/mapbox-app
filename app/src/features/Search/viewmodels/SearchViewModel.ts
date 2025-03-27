// src/features/Search/viewmodels/SearchViewModel.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { SearchResult } from '../models/Search';
import { SearchService } from '../services/SearchService';
import { Coordinate } from '../../Map/models/Location';

export class SearchViewModel {
  searchQuery: string = '';
  searchResults: SearchResult[] = [];
  selectedDestination: SearchResult | null = null;
  isSearching: boolean = false;
  
  constructor(private userLocationProvider: () => Coordinate) {
    makeAutoObservable(this);
  }
  
  setSearchQuery(query: string) {
    this.searchQuery = query;
    this.performSearch();
  }
  
  async performSearch() {
    if (this.searchQuery.length < 3) {
      runInAction(() => {
        this.searchResults = [];
      });
      return;
    }
    
    this.isSearching = true;
    try {
      // Pass the user's current location to prioritize nearby places
      const results = await SearchService.searchAddress(this.searchQuery, this.userLocationProvider());
      runInAction(() => {
        this.searchResults = results;
      });
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      runInAction(() => {
        this.isSearching = false;
      });
    }
  }
  
  selectDestination(result: SearchResult) {
    console.log("SearchViewModel: Selected destination:", result.placeName);
    runInAction(() => {
      this.selectedDestination = result;
      this.searchQuery = result.placeName;
      this.searchResults = [];
    });
  }
  
  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
  }
  
  clearDestination() {
    this.selectedDestination = null;
  }
  
  get hasSelectedDestination(): boolean {
    return this.selectedDestination !== null;
  }
  
  get destinationCoordinates(): [number, number] | null {
    return this.selectedDestination ? this.selectedDestination.coordinates : null;
  }
  
  get destinationName(): string {
    return this.selectedDestination ? this.selectedDestination.placeName.split(',')[0] : '';
  }
}