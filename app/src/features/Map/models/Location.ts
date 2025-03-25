export interface Coordinate {
    longitude: number;
    latitude: number;
  }
  
  export const toGeoJSONCoordinate = (coord: Coordinate): [number, number] => {
    return [coord.longitude, coord.latitude];
  };