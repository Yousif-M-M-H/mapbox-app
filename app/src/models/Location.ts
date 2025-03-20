export interface Coordinate {
    longitude: number;
    latitude: number;
  }
  
  export interface LocationModel {
    userLocation: Coordinate;
    destinationLocation: Coordinate;
  }
  
  export const toGeoJSONCoordinate = (coord: Coordinate): [number, number] => {
    return [coord.longitude, coord.latitude];
  };