// app/src/features/SDSM/views/VRUMarkers.tsx

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import Icon from '@expo/vector-icons/FontAwesome';
import { VRUData } from '../models/SDSMTypes';

interface VRUMarkersProps {
  vrus: VRUData[];
  isActive: boolean;
  getMapboxCoordinates: (vru: VRUData) => [number, number];
}

// Memoized VRU icon to prevent re-renders
const VRUIcon = memo<{ heading?: number }>(({ heading }) => {
  const rotationStyle = heading !== undefined ? {
    transform: [{ rotate: `${heading}deg` }]
  } : {};

  return (
    <View style={[styles.iconWrapper, rotationStyle]}>
      <Icon name="user" size={16} color="#FF6B35" />
    </View>
  );
});

// Memoized individual VRU marker
const VRUMarker = memo<{
  vru: VRUData;
  mapboxCoords: [number, number];
}>(({ vru, mapboxCoords }) => {
  return (
    <MapboxGL.PointAnnotation
      key={`sdsm-vru-${vru.id}`}
      id={`sdsm-vru-${vru.id}`}
      coordinate={mapboxCoords}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <VRUIcon heading={vru.heading} />
    </MapboxGL.PointAnnotation>
  );
});

export const VRUMarkers: React.FC<VRUMarkersProps> = observer(({ vrus, isActive, getMapboxCoordinates }) => {
  // Early return if not active or no VRUs
  if (!isActive || vrus.length === 0) {
    return null;
  }

  return (
    <>
      {vrus.map((vru) => {
        const mapboxCoords = getMapboxCoordinates(vru);

        // Skip invalid coordinates
        if (!mapboxCoords || mapboxCoords[0] === 0 || mapboxCoords[1] === 0) {
          return null;
        }

        return (
          <VRUMarker
            key={vru.id}
            vru={vru}
            mapboxCoords={mapboxCoords}
          />
        );
      })}
    </>
  );
});

const styles = StyleSheet.create({
  iconWrapper: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
});