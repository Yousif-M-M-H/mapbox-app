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
  
  // Ensure coordinates are in [longitude, latitude] format
  const coordinates = vehicle.location.coordinates;
  
  // Validation to ensure coordinates are valid
  if (!coordinates || coordinates.length !== 2) {
    console.warn(`Invalid coordinates for vehicle ${vehicle.objectID}`);
    return null;
  }
  
  return (
    <MapboxGL.PointAnnotation
      id={`vehicle-${vehicle.objectID}-${vehicle._id}`} // Use both ID fields for uniqueness
      coordinate={coordinates}
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
    width: 14,
    height: 20,
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