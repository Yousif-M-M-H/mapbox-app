// app/src/features/SDSM/views/VehicleMarkers.tsx

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';
import Icon from '@expo/vector-icons/FontAwesome';

interface VehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

// Memoized vehicle icon to prevent re-renders
const VehicleIcon = memo<{ heading?: number }>(({ heading }) => {
  const rotationStyle = heading !== undefined ? {
    transform: [{ rotate: `${heading}deg` }]
  } : {};

  return (
    <View style={[styles.iconWrapper, rotationStyle]}>
      <Icon name="car" size={20} color="#2563EB" />
    </View>
  );
});

// Memoized individual vehicle marker
const VehicleMarker = memo<{
  vehicle: any;
  mapboxCoords: [number, number];
}>(({ vehicle, mapboxCoords }) => {
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

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  // Early return if not active or no vehicles
  if (!viewModel?.isActive || viewModel.vehicles.length === 0) {
    return null;
  }

  return (
    <>
      {viewModel.vehicles.map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);
        
        // Skip invalid coordinates
        if (!mapboxCoords || mapboxCoords[0] === 0 || mapboxCoords[1] === 0) {
          return null;
        }

        return (
          <VehicleMarker
            key={vehicle.id}
            vehicle={vehicle}
            mapboxCoords={mapboxCoords}
          />
        );
      })}
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