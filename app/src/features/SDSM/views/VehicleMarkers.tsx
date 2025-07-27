// app/src/features/SDSM/views/VehicleMarkers.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VehicleDisplayViewModel } from '../viewmodels/VehicleDisplayViewModel';

interface VehicleMarkersProps {
  viewModel: VehicleDisplayViewModel;
}

export const VehicleMarkers: React.FC<VehicleMarkersProps> = observer(({ viewModel }) => {
  // Don't render if not active or no vehicles
  if (!viewModel?.isActive || viewModel.vehicles.length === 0) {
    return null;
  }

  return (
    <>
      {viewModel.vehicles.map((vehicle) => {
        const mapboxCoords = viewModel.getMapboxCoordinates(vehicle);

        // Validate coordinates before rendering
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
            <View
              style={[
                styles.vehicleMarker,
                vehicle.heading !== undefined && styles.vehicleWithHeading,
              ]}
            >
              {/* Heading indicator if available */}
              {vehicle.heading !== undefined && (
                <View
                  style={[
                    styles.headingIndicator,
                    { transform: [{ rotate: `${vehicle.heading}deg` }] },
                  ]}
                />
              )}
              <View style={styles.vehicleCore} />
            </View>
          </MapboxGL.PointAnnotation>
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  vehicleMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00FF00', // Bright green for SDSM vehicles
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  vehicleWithHeading: {
    backgroundColor: '#00AA00', // Slightly darker green when heading available
  },
  vehicleCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  headingIndicator: {
    position: 'absolute',
    top: -5,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFF00', // Yellow heading indicator
  },
});
