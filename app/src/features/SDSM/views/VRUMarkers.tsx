// app/src/features/SDSM/views/VRUMarkers.tsx
import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import { observer } from 'mobx-react-lite';
import { VRUData } from '../models/SDSMTypes';
import { recordOverlayEvent } from '../SDSMObjectTracker';

interface VRUMarkersProps {
  vrus: VRUData[];
  isActive: boolean;
  getMapboxCoordinates: (vru: VRUData) => [number, number];
}

const VRUIcon = memo(() => (
  <View style={styles.vruIcon}>
    <View style={styles.vruIconInner} />
  </View>
));

const VRUMarker = memo<{
  vru: VRUData;
  mapboxCoords: [number, number];
}>(({ vru, mapboxCoords }) => {
  // Record overlay event when this VRU is first rendered
  useEffect(() => {
    recordOverlayEvent(vru.id);
  }, [vru.id]);

  return (
    <MapboxGL.PointAnnotation
      key={`sdsm-vru-${vru.id}`}
      id={`sdsm-vru-${vru.id}`}
      coordinate={mapboxCoords}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <VRUIcon />
    </MapboxGL.PointAnnotation>
  );
});

export const VRUMarkers: React.FC<VRUMarkersProps> = observer(({ vrus, isActive, getMapboxCoordinates }) => {
  if (!isActive || vrus.length === 0) {
    return null;
  }

  return (
    <>
      {vrus.map((vru) => {
        const mapboxCoords = getMapboxCoordinates(vru);

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
  vruIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FF6B35',
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
  vruIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
});