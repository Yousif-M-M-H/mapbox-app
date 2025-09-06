// Pure functions for data transformation - no state
export class VehicleDataService {
  static extractVehicles(response: SDSMResponse): VehicleData[] {
    if (!response?.objects) return [];
    
    return response.objects
      .filter(obj => obj.type === 'vehicle')
      .map(obj => ({
        id: obj.objectID,
        coordinates: obj.location.coordinates,
        heading: obj.heading,
        speed: obj.speed,
        size: obj.size
      }))
      .filter(v => v.coordinates[0] !== 0 && v.coordinates[1] !== 0);
  }

  static toMapboxCoordinates(vehicle: VehicleData): [number, number] {
    const [lat, lng] = vehicle.coordinates;
    return [lng, lat]; // Mapbox expects [lng, lat]
  }

  static hasVehicleChanged(oldVehicle: VehicleData, newVehicle: VehicleData): boolean {
    return oldVehicle.coordinates[0] !== newVehicle.coordinates[0] ||
           oldVehicle.coordinates[1] !== newVehicle.coordinates[1] ||
           oldVehicle.heading !== newVehicle.heading;
  }
}