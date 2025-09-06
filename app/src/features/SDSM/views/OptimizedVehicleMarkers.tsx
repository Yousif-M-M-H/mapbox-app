// app/src/features/SDSM/views/OptimizedVehicleMarkers.tsx
import React, { useCallback, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';
import Icon from '@expo/vector-icons/FontAwesome';

interface OptimizedVehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

// Memoized Vehicle Icon to prevent unnecessary re-renders
const VehicleIcon = React.memo<{ heading?: number }>(({ heading }) => {
  const rotationStyle = useMemo(() => {
    return heading !== undefined ? {
      transform: [{ rotate: `${heading}deg` }]
    } : {};
  }, [heading]);

  return (
    <View style={[styles.iconWrapper, rotationStyle]}>
      <Icon name="car" size={20} color="#2563EB" />
    </View>
  );
});

// Individual Vehicle Marker Component (memoized)
const VehicleMarker = React.memo<{
  vehicle: any;
  getMapboxCoordinates: (vehicle: any) => [number, number];
  latencyTracker: any;
}>(({ vehicle, getMapboxCoordinates, latencyTracker }) => {
  const mapboxCoords = useMemo(() => 
    getMapboxCoordinates(vehicle), [vehicle.coordinates, getMapboxCoordinates]
  );

  // Track overlay timing when this specific marker is rendered
  React.useEffect(() => {
    latencyTracker.recordObjectOverlay(vehicle.id, 'vehicle');
  }, [vehicle.id, latencyTracker]);

  if (!mapboxCoords || mapboxCoords[0] === 0 || mapboxCoords[1] === 0) {
    return null;
  }

  return (
    <MapboxGL.PointAnnotation
      key={`sdsm-vehicle-${vehicle.id}`}
      id={`sdsm-vehicle-${vehicle.id}`}
      coordinate={mapboxCoords}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <VehicleIcon heading={vehicle.heading} />
    </MapboxGL.PointAnnotation>
  );
});

export const OptimizedVehicleMarkers: React.FC<OptimizedVehicleMarkersProps> = observer(({ viewModel }) => {
  
  // Memoize the coordinate conversion function
  const getMapboxCoordinates = useCallback((vehicle: any) => {
    return viewModel.getMapboxCoordinates(vehicle);
  }, [viewModel]);

  // Memoize the vehicle list to prevent unnecessary re-renders
  const vehicles = useMemo(() => viewModel.vehicles, [viewModel.vehicles]);

  if (!viewModel?.isActive || vehicles.length === 0) {
    return null;
  }

  return (
    <>
      {vehicles.map((vehicle) => (
        <VehicleMarker
          key={vehicle.id}
          vehicle={vehicle}
          getMapboxCoordinates={getMapboxCoordinates} latencyTracker={undefined}        />
      ))}
    </>
  );
});

const styles = StyleSheet.create({
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});