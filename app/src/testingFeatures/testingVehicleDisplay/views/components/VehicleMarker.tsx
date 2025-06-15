// app/src/testingFeatures/testingVehicleDisplay/views/components/VehicleMarker.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { TestingVehicleDisplayViewModel } from '../../viewmodels/TestingVehicleDisplayViewModel';

interface VehicleMarkersProps {
  viewModel: TestingVehicleDisplayViewModel | null;
}

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  if (!viewModel || !viewModel.isActive || viewModel.vehicles.length === 0) {
    return null;
  }

  return (
    <>
      {viewModel.vehicles.map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);
        
        return (
          <MapboxGL.PointAnnotation
            key={`vehicle-${vehicle.objectID}`}
            id={`vehicle-${vehicle.objectID}`}
            coordinate={mapboxCoords}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.vehicleMarker}>
              <View style={styles.vehicleInner} />
            </View>
          </MapboxGL.PointAnnotation>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  vehicleMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#00FF00', // Green for vehicles
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});