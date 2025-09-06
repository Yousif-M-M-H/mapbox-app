import { useEffect, useMemo } from 'react';
import { VehicleStore } from '../stores/VehicleStore';

// Singleton store instance
let store: VehicleStore | null = null;

export function useVehicles() {
  const vehicleStore = useMemo(() => {
    if (!store) {
      store = new VehicleStore();
    }
    return store;
  }, []);

  useEffect(() => {
    vehicleStore.start();
    return () => vehicleStore.stop();
  }, [vehicleStore]);

  return vehicleStore;
}