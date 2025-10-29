// app/src/features/SDSM/views/VehicleMarkers.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';

interface VehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

const VehicleIcon = () => (
  <View style={styles.vehicleIcon}>
    <View style={styles.vehicleIconInner} />
  </View>
);

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  if (!viewModel?.isActive || viewModel.vehicles.length === 0) {
    return null;
  }

  return (
    <>
      {viewModel.vehicles.map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);
        if (!mapboxCoords || mapboxCoords[0] === 0 || mapboxCoords[1] === 0) return null;

        return (
          <VehicleMarkerItem
            key={`sdsm-vehicle-${vehicle.id}`}
            vehicleId={vehicle.id}
            coordinates={mapboxCoords}
          />
        );
      })}
    </>
  );
});

// Separate component to track individual vehicle overlay events
const VehicleMarkerItem: React.FC<{
  vehicleId: number;
  coordinates: [number, number];
}> = ({ vehicleId, coordinates }) => {
  // Record overlay event when this vehicle is first rendered
  useEffect(() => {
  }, [vehicleId]);

  return (
    <MapboxGL.PointAnnotation
      id={`sdsm-vehicle-${vehicleId}`}
      coordinate={coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <VehicleIcon />
    </MapboxGL.PointAnnotation>
  );
};

const styles = StyleSheet.create({
  vehicleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  vehicleIconInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
});