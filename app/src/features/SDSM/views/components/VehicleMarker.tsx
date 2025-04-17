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
  // Calculate marker size based on vehicle dimensions
  // We'll scale the vehicle size to make it visible on the map
  const scaleFactor = 0.5;
  const width = Math.max(15, vehicle.size.width * scaleFactor / 10);
  const length = Math.max(20, vehicle.size.length * scaleFactor / 10);
  
  // Handle rotation based on vehicle heading
  const rotation = vehicle.heading || 0;
  
  // Create style based on vehicle properties
  const getVehicleStyle = () => {
    // You could change color based on speed, type, etc.
    return {
      width: width,
      height: length,
      borderRadius: 3,
      backgroundColor: '#FF5722', // Vehicle color
      borderWidth: 1,
      borderColor: '#FFF',
      transform: [{ rotate: `${rotation}deg` }]
    };
  };
  
  return (
    <MapboxGL.PointAnnotation
      id={`vehicle-${vehicle.objectID}`}
      coordinate={vehicle.location.coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
      onSelected={() => onPress && onPress(vehicle)}
    >
      <View style={[styles.vehicleMarker, getVehicleStyle()]} />
    </MapboxGL.PointAnnotation>
  );
};

const styles = StyleSheet.create({
  vehicleMarker: {
    justifyContent: 'center',
    alignItems: 'center',
    // Base styles - will be overridden by dynamic styles
  }
});