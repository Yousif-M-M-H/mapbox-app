// src/models/Search.ts
export interface SearchResult {
    placeName: string;
    coordinates: [number, number];
    relevance?: number;
    distance?: number;
  }