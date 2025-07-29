// app/src/features/SDSM/views/VehicleMarkers.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';
import Icon from '@expo/vector-icons/FontAwesome'; 

interface VehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  if (!viewModel?.isActive || viewModel.vehicles.length === 0) {
    return null;
  }

  return (
    <>
      {viewModel.vehicles.map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);

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
      })}
    </>
  );
});

interface VehicleIconProps {
  heading?: number;
}

const VehicleIcon: React.FC<VehicleIconProps> = ({ heading }) => {
  const rotationStyle = heading !== undefined ? {
    transform: [{ rotate: `${heading}deg` }]
  } : {};

  return (
    <View style={[styles.iconWrapper, rotationStyle]}>
      <Icon name="car" size={20} color="#2563EB" />
    </View>
  );
};

const styles = StyleSheet.create({
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});