// app/src/features/Map/views/components/PedestrianMarker.tsx

import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

interface PedestrianMarkerProps {
  id: number;
  coordinates: [number, number];
  isInCrosswalk?: boolean;
}

export const PedestrianMarker: React.FC<PedestrianMarkerProps> = ({ 
  id, 
  coordinates,
  isInCrosswalk = false
}) => {
  try {
    // Safety check for coordinates
    if (!coordinates || coordinates.length !== 2 || 
        typeof coordinates[0] !== 'number' || 
        typeof coordinates[1] !== 'number') {
      return null;
    }
    
    // Convert from [lat, lon] to [lon, lat] for MapboxGL
    const mapboxCoords: [number, number] = [coordinates[1], coordinates[0]];
    
    return (
      <MapboxGL.PointAnnotation
        id={`pedestrian-${id}`}
        coordinate={mapboxCoords}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={[
          styles.pedestrianMarker,
          isInCrosswalk ? styles.crossingPedestrian : {}
        ]}>
          <View style={styles.markerInner} />
        </View>
      </MapboxGL.PointAnnotation>
    );
  } catch (error) {
    console.error('Error rendering pedestrian marker:', error);
    return null;
  }
};

const styles = StyleSheet.create({
  pedestrianMarker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF9800',  // Default orange
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  crossingPedestrian: {
    backgroundColor: '#FF3B30',  // Bright red for pedestrians in crosswalk
    borderColor: '#FFFF00',      // Yellow border
    width: 20,                   // Slightly larger
    height: 20,
    borderRadius: 10,
  },
  markerInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  }
});