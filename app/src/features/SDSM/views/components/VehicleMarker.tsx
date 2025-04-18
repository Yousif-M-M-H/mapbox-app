// app/src/features/SDSM/views/components/VehicleMarker.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { SDSMVehicle } from '../../models/SDSMData';

interface VehicleMarkerProps {
  vehicle: SDSMVehicle;
  onPress?: (vehicle: SDSMVehicle) => void;
}

export const VehicleMarker: React.FC<VehicleMarkerProps> = ({ vehicle, onPress }) => {
  // Use heading field for rotation
  const rotation = vehicle.heading || 0;
  
  return (
    <MapboxGL.PointAnnotation
      id={`vehicle-${vehicle.objectID}`}
      coordinate={vehicle.location.coordinates}
      anchor={{x: 0.5, y: 0.5}}
      onSelected={() => onPress && onPress(vehicle)}
    >
      <View style={styles.vehicleContainer}>
        <View 
          style={[
            styles.vehicleBody, 
            { 
              backgroundColor: '#FF0000', 
              transform: [{ rotate: `${rotation}deg` }] 
            }
          ]}
        >
          <View style={styles.vehicleFront} />
        </View>
      </View>
    </MapboxGL.PointAnnotation>
  );
};

const styles = StyleSheet.create({
  vehicleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleBody: {
    width: 24,
    height: 36,
    backgroundColor: '#FF0000',
    borderRadius: 4,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'flex-start',
    alignItems: 'center',
    overflow: 'hidden',
  },
  vehicleFront: {
    position: 'absolute',
    top: 0,
    width: '60%',
    height: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  }
});